import { makeAutoObservable, runInAction } from 'mobx';
import { z } from 'zod';

import type { Session } from 'src/model/Session/Session';
import type { LogSettingsData } from 'src/model/AppDataManager/DataClasses/LogSettingsData';
import { SettingsBranch } from 'src/model/Settings/SettingsBranch';

export enum WhatToNameTheFile {
  CURRENT_DATETIME,
  CUSTOM,
}

export enum ExistingFileBehaviors {
  APPEND,
  OVERWRITE,
}

/**
 * This class uses Electron's native file system API for logging functionality.
 */
export default class Logging {
  session: Session;

  /**
   * The persisted log settings — the only copy of each setting. See
   * `SettingsBranch`.
   *
   * There is deliberately no "ignore reloads while logging" guard any more.
   * The settings a running log depends on (directory, file name,
   * existing-file behaviour) are read once in `startLogging`, and the two read
   * live (`logRawTxData`/`logRawRxData`) are ones a user applying a preset
   * would expect to take effect.
   */
  private readonly branch = new SettingsBranch<LogSettingsData>('settings.logSettings', (c) => c.settings.logSettings);

  /**
   * Directory log files are written to. Null only until the platform default
   * has been fetched from the main process (see `_useDefaultLogDirectoryIfUnset`).
   */
  get dirPath(): string | null {
    return this.branch.data.logDirectory;
  }
  setDirPath = this.branch.setter('logDirectory');

  /**
   * File name used when `whatToNameTheFile` is CUSTOM.
   */
  customFileName = this.branch.applyableText(
    'customFileName',
    z.string().min(1).regex(new RegExp(/^[\w,\s.-]+$/), 'Filename should contain only alphanumeric characters, spaces, periods, and dashes.'),
  );

  /**
   * What naming scheme to use for log files.
   */
  get whatToNameTheFile() {
    return this.branch.data.whatToNameTheFile;
  }
  setWhatToNameTheFile = this.branch.setter('whatToNameTheFile');

  /**
   * How to handle existing files when logging is started.
   */
  get existingFileBehavior() {
    return this.branch.data.existingFileBehavior;
  }
  setExistingFileBehavior = this.branch.setter('existingFileBehavior');

  /**
   * Whether to log raw transmitted data to the log file.
   */
  get logRawTxData() {
    return this.branch.data.logRawTxData;
  }
  setLogRawTxData = this.branch.setter('logRawTxData');

  /**
   * Whether to log raw received data to the log file.
   */
  get logRawRxData() {
    return this.branch.data.logRawRxData;
  }
  setLogRawRxData = this.branch.setter('logRawRxData');

  /**
   * Full path to the active log file when logging is in progress.
   */
  activeFilePath: string | null = null;

  isLogging = false;

  intervalId: NodeJS.Timeout | null = null;

  /**
   * Data received since the last successful write, held as the original chunks
   * rather than flattened into one byte array.
   *
   * Deliberately not observable, and not flattened per byte. This used to be an
   * observable `number[]` filled via `bufferedData.push(...rxData)`, which
   * spread the chunk into function arguments — throwing
   * `RangeError: Maximum call stack size exceeded` past ~65k bytes, which one
   * large RTT or socket read reaches — and fired one MobX change notification
   * per received byte. Nothing outside this class reads it.
   *
   * Chunks are retained by reference. Every caller (`App.parseRxData`,
   * `App.writeBytesToSerialPort`) hands over a freshly created `Uint8Array`
   * that it never touches again, so there is no aliasing risk; a caller that
   * reused its buffer would require a copy on ingest here.
   */
  private bufferedChunks: Uint8Array[] = [];

  /** Total bytes across `bufferedChunks`, tracked so writes needn't re-sum. */
  private bufferedByteCount = 0;

  /**
   * Tail of the chain of writes issued so far.
   *
   * Writes must not overlap. Two concurrent appends both read the buffer
   * before either clears it, so the same bytes get written twice and can land
   * out of order — a 1s interval tick firing while a slow write is still in
   * flight was enough to corrupt the log. Every call chains behind the last.
   */
  private writeChain: Promise<void> = Promise.resolve();

  activeFilename: string | null = null;

  numBytesWritten: number | null = null;

  fileSizeBytes: number | null = null;

  constructor(session: Session) {
    this.session = session;
    this.branch.attach(session);

    makeAutoObservable<Logging, 'branch' | 'bufferedChunks' | 'bufferedByteCount' | 'writeChain'>(this, {
      branch: false,
      // The write buffer is imperative plumbing, not UI state — nothing
      // outside this class reads it, and making it observable is what put a
      // change notification on every received byte.
      bufferedChunks: false,
      bufferedByteCount: false,
      writeChain: false,
    });

    // A config with no log directory (first run, or a preset that never set
    // one) gets the platform default — now, and after any reload that leaves
    // it empty.
    void this._useDefaultLogDirectoryIfUnset();
    session.registerOnConfigReload(['settings.logSettings'], () => {
      void this._useDefaultLogDirectoryIfUnset();
    });
  }

  /**
   * Fills in the log directory from the main process's default when the config
   * has none, and persists it so it is remembered.
   */
  private async _useDefaultLogDirectoryIfUnset() {
    if (this.dirPath) {
      return;
    }
    try {
      const result = await window.electronAPI.fs.getDefaultLogDirectory();
      // Re-check: the user may have picked a directory while this was in flight.
      if (result.success && result.path && !this.dirPath) {
        this.setDirPath(result.path);
      }
    } catch (error) {
      console.error('Failed to get the default log directory:', error);
    }
  }

  /**
   * Opens Electron's native directory picker to select a directory to save logs to.
   * The selected directory is saved to the current profile.
   */
  async openDirPicker() {
    try {
      const result = await window.electronAPI.fs.selectDirectory();

      if (result.success && result.path) {
        this.setDirPath(result.path);
      }
      // If canceled, result.canceled will be true, but we don't need to handle it
    } catch (e) {
      console.error('Failed to open directory picker:', e);
    }
  }

  get canStartStopLogging() {
    return this.dirPath !== null && (this.whatToNameTheFile === WhatToNameTheFile.CUSTOM ? this.customFileName.isValid : true);
  }

  async startLogging() {
    if (this.dirPath === null) {
      throw Error('startLogging() called but dirPath is null');
    }

    const fileNamingMode = this.whatToNameTheFile;

    if (fileNamingMode === WhatToNameTheFile.CURRENT_DATETIME) {
      // Generate a file name based on the current datetime
      const now = new Date();
      const year = now.getFullYear().toString();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const date = now.getDate().toString().padStart(2, '0');
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      this.activeFilename = `NinjaTerm Logs - ${year}-${month}-${date} ${hours}-${minutes}-${seconds}.txt`;
    } else if (fileNamingMode === WhatToNameTheFile.CUSTOM) {
      this.activeFilename = this.customFileName.appliedValue;
    } else {
      throw Error(`Unknown value for whatToNameTheFile: ${fileNamingMode} (type: ${typeof fileNamingMode})`);
    }

    // Create full file path
    this.activeFilePath = `${this.dirPath}/${this.activeFilename}`;

    let fileSizeBytes = 0;

    // Handle existing file behavior
    const fileBehavior = this.existingFileBehavior;
    if (fileBehavior === ExistingFileBehaviors.APPEND) {
      // Check if file exists and get its size
      const fileExistsResult = await window.electronAPI.fs.fileExists(this.activeFilePath);
      if (fileExistsResult.success && fileExistsResult.exists) {
        const fileSizeResult = await window.electronAPI.fs.getFileSize(this.activeFilePath);
        if (fileSizeResult.success) {
          fileSizeBytes = fileSizeResult.size!;
        }
      }
    } else if (fileBehavior === ExistingFileBehaviors.OVERWRITE) {
      // Overwrite by writing empty content to the file
      await window.electronAPI.fs.writeFile(this.activeFilePath, new Uint8Array(0), false);
    } else {
      throw Error(`Unknown value for existingFileBehavior: ${fileBehavior} (type: ${typeof fileBehavior})`);
    }

    runInAction(() => {
      this.isLogging = true;
      this.numBytesWritten = 0;
      this.fileSizeBytes = fileSizeBytes;
    });

    // Setup regular 1s interval to write buffered data to this file
    this.intervalId = setInterval(() => {
      this.writeBufferedDataToDisk();
    }, 1000);
  }

  handleRxData(rxData: Uint8Array) {
    // Only buffer data if logging is enabled AND user has enabled logging of RX data
    if (this.isLogging === false || this.logRawRxData === false) {
      return;
    }
    this._bufferChunk(rxData);
  }

  handleTxData(txData: Uint8Array) {
    // Only buffer data if logging is enabled AND user has enabled logging of TX data
    if (this.isLogging === false || this.logRawTxData === false) {
      return;
    }
    this._bufferChunk(txData);
  }

  private _bufferChunk(data: Uint8Array) {
    if (data.length === 0) {
      return;
    }
    this.bufferedChunks.push(data);
    this.bufferedByteCount += data.length;
  }

  /**
   * Writes everything buffered so far to the log file.
   *
   * The returned promise resolves when *this* write has finished. Calls are
   * serialised via `writeChain`, so an interval tick arriving mid-write queues
   * behind the in-flight write instead of racing it.
   */
  writeBufferedDataToDisk(): Promise<void> {
    this.writeChain = this.writeChain.then(() => this._writeOnce());
    return this.writeChain;
  }

  /**
   * Performs a single write.
   *
   * Never rejects: a rejection would poison `writeChain` and silently stop
   * every future write for the rest of the session.
   */
  private async _writeOnce(): Promise<void> {
    if (this.activeFilePath === null || this.bufferedChunks.length === 0) {
      return;
    }

    // Take the buffer *before* awaiting. The previous version cleared it after
    // the await, so everything that arrived while the write was in flight was
    // discarded — and counted towards `numBytesWritten` regardless.
    const chunks = this.bufferedChunks;
    const byteCount = this.bufferedByteCount;
    this.bufferedChunks = [];
    this.bufferedByteCount = 0;

    const payload = Logging._concatChunks(chunks, byteCount);

    try {
      // Write the buffered data to the file (append mode)
      const result = await window.electronAPI.fs.writeFile(this.activeFilePath, payload, true);

      if (result.success) {
        runInAction(() => {
          this.numBytesWritten! += byteCount;
          this.fileSizeBytes! += byteCount;
        });
      } else {
        this._requeue(chunks, byteCount);
        console.error('Failed to write to log file:', result.error);
        this.session.snackbar.sendToSnackbar(`Failed to write to log file: ${result.error}`, 'error');
      }
    } catch (error) {
      this._requeue(chunks, byteCount);
      console.error('Error writing buffered data to disk:', error);
      this.session.snackbar.sendToSnackbar(`Error writing to log file: ${error}`, 'error');
    }
  }

  /**
   * Returns an unwritten batch to the head of the buffer so the next tick
   * retries it. It goes back in *front* of anything that arrived meanwhile —
   * order matters in a log file.
   */
  private _requeue(chunks: Uint8Array[], byteCount: number) {
    // `concat`, not `unshift(...chunks)`: spreading would reintroduce the
    // argument-count limit this class was just fixed for.
    this.bufferedChunks = chunks.concat(this.bufferedChunks);
    this.bufferedByteCount += byteCount;
  }

  /** Flattens buffered chunks into the single array the IPC write takes. */
  private static _concatChunks(chunks: Uint8Array[], byteCount: number): Uint8Array {
    if (chunks.length === 1) {
      return chunks[0];
    }
    const out = new Uint8Array(byteCount);
    let offset = 0;
    for (const chunk of chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  }

  async stopLogging() {
    // Stop the repeated writing to disk of buffered data in the future
    clearInterval(this.intervalId!);
    this.intervalId = null;

    // Write the last of the buffered data to disk. This chains behind any
    // in-flight write, so data buffered during that write is flushed too.
    await this.writeBufferedDataToDisk();

    runInAction(() => {
      this.isLogging = false;
      this.activeFilename = null;
      this.activeFilePath = null;
      this.numBytesWritten = null;
      this.fileSizeBytes = null;
    });
  }
}
