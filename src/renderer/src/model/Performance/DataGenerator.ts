/**
 * Synthetic data generator for testing NinjaTerm performance
 * with various data patterns and rates.
 */
export class DataGenerator {

  /**
   * Generate ASCII text data at specified rate
   */
  static generateAsciiData(numBytes: number, pattern: 'random' | 'repeated' | 'mixed' = 'mixed'): Uint8Array {
    const data = new Uint8Array(numBytes);

    switch (pattern) {
      case 'random':
        for (let i = 0; i < numBytes; i++) {
          // Generate printable ASCII characters (32-126)
          data[i] = 32 + Math.floor(Math.random() * 95);
        }
        break;

      case 'repeated':
        // Repeating pattern: "Hello World!\n"
        const message = "Hello World!\n";
        for (let i = 0; i < numBytes; i++) {
          data[i] = message.charCodeAt(i % message.length);
        }
        break;

      case 'mixed':
        // Mix of text, numbers, and control characters
        for (let i = 0; i < numBytes; i++) {
          if (i % 50 === 0) {
            data[i] = 10; // Newline every 50 chars
          } else if (i % 10 === 0) {
            data[i] = 9;  // Tab every 10 chars
          } else {
            data[i] = 65 + (i % 26); // A-Z cycling
          }
        }
        break;
    }

    return data;
  }

  /**
   * Generate graphing data with y= prefix
   */
  static generateGraphingData(numDataPoints: number, yValueRange: [number, number] = [0, 100]): Uint8Array {
    const [minY, maxY] = yValueRange;
    let dataString = '';

    for (let i = 0; i < numDataPoints; i++) {
      const yValue = minY + Math.random() * (maxY - minY);
      dataString += `y=${yValue.toFixed(2)}\n`;
    }

    return new TextEncoder().encode(dataString);
  }

  /**
   * Generate advanced plotting commands - returns chunks from a continuous byte stream
   */
  static generatePlotCommands(numPlots: number = 2, pointsPerPlot: number = 10): Uint8Array {
    // Initialize state if not already done
    if (!DataGenerator._plotCommandState) {
      // Generate the entire command sequence as one big string
      let commandString = '';

      // Create plots
      for (let plotId = 0; plotId < numPlots; plotId++) {
        commandString += `#PLOT:CREATE,id=plot${plotId},title="Test Plot ${plotId}",xlabel="Time",ylabel="Value";\n`;
        commandString += `#PLOT:TRACE,plot=plot${plotId},id=trace${plotId},name="Trace ${plotId}",color="#ff0000",xtype=timestamp;\n`;
      }

      // Add data points
      for (let i = 0; i < pointsPerPlot; i++) {
        for (let plotId = 0; plotId < numPlots; plotId++) {
          const values = Array.from({length: 5}, () => (Math.random() * 100).toFixed(2)).join(',');
          commandString += `#PLOT:DATA,trace=trace${plotId},data=[${values}];\n`;
        }
      }

      // Convert to bytes once
      DataGenerator._plotCommandState = {
        fullSequence: new TextEncoder().encode(commandString),
        currentOffset: 0
      };

      console.log('Generated full plot command sequence (' + DataGenerator._plotCommandState.fullSequence.length + ' bytes):');
      console.log(commandString);
    }

    // Return the next chunk of the sequence
    const state = DataGenerator._plotCommandState;
    const chunkSize = 64; // Match the chunk size used in performance tests
    
    if (state.currentOffset < state.fullSequence.length) {
      // Return next chunk
      const endOffset = Math.min(state.currentOffset + chunkSize, state.fullSequence.length);
      const chunk = state.fullSequence.slice(state.currentOffset, endOffset);
      state.currentOffset = endOffset;
      return chunk;
    } else {
      // Generate more data commands when we've sent the full initial sequence
      const plotId = Math.floor(Math.random() * numPlots);
      const values = Array.from({length: 5}, () => (Math.random() * 100).toFixed(2)).join(',');
      const moreData = `#PLOT:DATA,trace=trace${plotId},data=[${values}];\n`;
      return new TextEncoder().encode(moreData);
    }
  }

  // Static state for plot command generation
  private static _plotCommandState: {
    fullSequence: Uint8Array;
    currentOffset: number;
  } | null = null;

  /**
   * Generate only DATA commands for existing plots/traces
   */
  static generatePlotDataCommands(numPlots: number = 1): Uint8Array {
    // Generate data for a random plot/trace
    const plotId = Math.floor(Math.random() * numPlots);
    const values = Array.from({length: 5}, () => (Math.random() * 100).toFixed(2)).join(',');
    const command = `#PLOT:DATA,trace=trace${plotId},data=[${values}];\n`;
    return new TextEncoder().encode(command);
  }

  /**
   * Reset plot command generation state
   */
  static resetPlotCommandGeneration(): void {
    DataGenerator._plotCommandState = null;
  }

  /**
   * Generate data with ANSI escape codes for terminal stress testing
   */
  static generateAnsiData(numBytes: number): Uint8Array {
    let dataString = '';
    const colors = [30, 31, 32, 33, 34, 35, 36, 37]; // ANSI colors

    let byteCount = 0;
    while (byteCount < numBytes) {
      // Add colored text
      const color = colors[Math.floor(Math.random() * colors.length)];
      const text = `\x1b[${color}mColored text ${Math.random().toFixed(3)}\x1b[0m `;
      dataString += text;
      byteCount += text.length;

      // Add newlines periodically
      if (byteCount % 100 < text.length) {
        dataString += '\n';
        byteCount += 1;
      }
    }

    return new TextEncoder().encode(dataString.substring(0, numBytes));
  }

  /**
   * Generate binary data for number parsing testing
   */
  static generateBinaryData(numBytes: number, numberType: 'uint8' | 'uint16' | 'uint32' | 'float32' = 'uint8'): Uint8Array {
    const data = new Uint8Array(numBytes);

    switch (numberType) {
      case 'uint8':
        for (let i = 0; i < numBytes; i++) {
          data[i] = Math.floor(Math.random() * 256);
        }
        break;

      case 'uint16':
        // Generate 16-bit values (2 bytes each)
        for (let i = 0; i < numBytes - 1; i += 2) {
          const value = Math.floor(Math.random() * 65536);
          data[i] = value & 0xFF;         // Low byte
          data[i + 1] = (value >> 8) & 0xFF; // High byte
        }
        break;

      case 'uint32':
        // Generate 32-bit values (4 bytes each)
        for (let i = 0; i < numBytes - 3; i += 4) {
          const value = Math.floor(Math.random() * 4294967296);
          data[i] = value & 0xFF;
          data[i + 1] = (value >> 8) & 0xFF;
          data[i + 2] = (value >> 16) & 0xFF;
          data[i + 3] = (value >> 24) & 0xFF;
        }
        break;

      case 'float32':
        // Generate float32 values (4 bytes each)
        const floatArray = new Float32Array(Math.floor(numBytes / 4));
        for (let i = 0; i < floatArray.length; i++) {
          floatArray[i] = Math.random() * 1000;
        }
        data.set(new Uint8Array(floatArray.buffer));
        break;
    }

    return data;
  }

  /**
   * Create a data stream simulator that feeds data at a controlled rate
   */
  static createDataStream(
    dataGenerator: () => Uint8Array,
    dataHandler: (data: Uint8Array) => void,
    bytesPerSecond: number,
    chunkSize: number = 64
  ): { start: () => void; stop: () => void; getStats: () => any } {
    let intervalId: NodeJS.Timeout | null = null;
    let totalBytesSent = 0;
    let startTime = 0;

    // Calculate interval to send chunks at the target rate
    // Use minimum 5ms interval to avoid browser timer limitations
    const minIntervalMs = 5;
    const idealIntervalMs = (chunkSize / bytesPerSecond) * 1000;
    const intervalMs = Math.max(minIntervalMs, idealIntervalMs);

    // Adjust chunk size if interval was clamped to minimum
    const effectiveChunkSize = idealIntervalMs < minIntervalMs
      ? Math.ceil((bytesPerSecond * minIntervalMs) / 1000)
      : chunkSize;

    console.log(`DataStream: ${bytesPerSecond} B/s, chunk: ${effectiveChunkSize}B, interval: ${intervalMs.toFixed(1)}ms`);

    const start = () => {
      if (intervalId) return; // Already running

      startTime = Date.now();
      totalBytesSent = 0;

      intervalId = setInterval(() => {
        // Generate data of the required size
        let data = dataGenerator();

        // Ensure we have enough data
        if (data.length < effectiveChunkSize) {
          const extendedData = new Uint8Array(effectiveChunkSize);
          let pos = 0;
          while (pos < effectiveChunkSize) {
            const remainingBytes = effectiveChunkSize - pos;
            if (data.length <= remainingBytes) {
              extendedData.set(data, pos);
              pos += data.length;
              if (pos < effectiveChunkSize) {
                data = dataGenerator(); // Generate more data
              }
            } else {
              extendedData.set(data.slice(0, remainingBytes), pos);
              pos = effectiveChunkSize;
            }
          }
          data = extendedData;
        } else if (data.length > effectiveChunkSize) {
          data = data.slice(0, effectiveChunkSize);
        }

        dataHandler(data);
        totalBytesSent += data.length;
      }, intervalMs);
    };

    const stop = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const getStats = () => {
      const elapsedMs = Date.now() - startTime;
      const actualBytesPerSecond = elapsedMs > 0 ? (totalBytesSent / elapsedMs) * 1000 : 0;

      return {
        totalBytesSent,
        elapsedMs,
        targetBytesPerSecond: bytesPerSecond,
        actualBytesPerSecond,
        accuracy: Math.abs(1 - (actualBytesPerSecond / bytesPerSecond))
      };
    };

    return { start, stop, getStats };
  }

  /**
   * Performance test scenarios
   */
  static readonly TEST_SCENARIOS = {
    LOW_RATE_ASCII: {
      name: 'Low Rate ASCII (1KB/s)',
      bytesPerSecond: 1024,
      dataGenerator: () => DataGenerator.generateAsciiData(64, 'mixed'),
      duration: 10000 // 10 seconds
    },

    MEDIUM_RATE_GRAPHING: {
      name: 'Medium Rate with Graphing (5KB/s)',
      bytesPerSecond: 5120,
      dataGenerator: () => DataGenerator.generateGraphingData(20),
      duration: 15000 // 15 seconds
    },

    HIGH_RATE_ANSI: {
      name: 'High Rate ANSI (10KB/s)',
      bytesPerSecond: 10240,
      dataGenerator: () => DataGenerator.generateAnsiData(128),
      duration: 10000
    },

    STRESS_TEST: {
      name: 'Stress Test (50KB/s)',
      bytesPerSecond: 51200,
      dataGenerator: () => DataGenerator.generateAsciiData(512, 'random'),
      duration: 5000 // 5 seconds
    },

    PLOT_COMMANDS: {
      name: 'Plot Commands Test',
      bytesPerSecond: 2048,
      dataGenerator: () => DataGenerator.generatePlotCommands(3, 5),
      duration: 8000
    }
  };
}

export default DataGenerator;
