/**
 * Batch processor for efficiently handling incoming serial data
 * by accumulating and processing data in chunks rather than byte-by-byte.
 */
export class BatchProcessor {
  private buffer: Uint8Array;
  private bufferPosition: number = 0;
  private readonly bufferSize: number;
  private readonly flushInterval: number;
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly onFlush: (data: Uint8Array) => void;
  
  constructor(
    bufferSize: number = 4096, // 4KB default buffer
    flushIntervalMs: number = 16, // ~60fps
    onFlush: (data: Uint8Array) => void
  ) {
    this.bufferSize = bufferSize;
    this.flushInterval = flushIntervalMs;
    this.onFlush = onFlush;
    this.buffer = new Uint8Array(bufferSize);
    this.resetFlushTimer();
  }

  /**
   * Add data to the batch buffer
   */
  addData(data: Uint8Array): void {
    // If data is larger than remaining buffer space, flush and process
    if (this.bufferPosition + data.length > this.bufferSize) {
      this.flush();
    }

    // If data is still larger than buffer size, process it directly
    if (data.length > this.bufferSize) {
      this.onFlush(data);
      return;
    }

    // Add to buffer
    this.buffer.set(data, this.bufferPosition);
    this.bufferPosition += data.length;

    // Reset flush timer since we got new data
    this.resetFlushTimer();
  }

  /**
   * Force flush any pending data
   */
  flush(): void {
    if (this.bufferPosition > 0) {
      const dataToFlush = new Uint8Array(this.bufferPosition);
      dataToFlush.set(this.buffer.subarray(0, this.bufferPosition));
      this.bufferPosition = 0;
      
      this.onFlush(dataToFlush);
    }
    
    this.clearFlushTimer();
  }

  /**
   * Reset the flush timer
   */
  private resetFlushTimer(): void {
    this.clearFlushTimer();
    this.flushTimer = setTimeout(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Clear the flush timer
   */
  private clearFlushTimer(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Get current buffer utilization
   */
  getBufferUtilization(): number {
    return this.bufferPosition / this.bufferSize;
  }

  /**
   * Get buffer statistics
   */
  getStats() {
    return {
      bufferSize: this.bufferSize,
      currentPosition: this.bufferPosition,
      utilization: this.getBufferUtilization(),
      hasFlushTimer: this.flushTimer !== null
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.clearFlushTimer();
    this.bufferPosition = 0;
  }
}

/**
 * Optimized string processing utilities for better performance
 */
export class StringProcessor {
  private static readonly textDecoder = new TextDecoder();
  private static readonly textEncoder = new TextEncoder();

  /**
   * Convert Uint8Array to string more efficiently than String.fromCharCode
   */
  static uint8ArrayToString(data: Uint8Array): string {
    // For small arrays, direct conversion might be faster
    if (data.length < 1000) {
      return String.fromCharCode(...data);
    }
    
    // For larger arrays, use TextDecoder
    try {
      return this.textDecoder.decode(data);
    } catch {
      // Fallback for non-UTF8 data
      return String.fromCharCode(...data);
    }
  }

  /**
   * Convert string to Uint8Array efficiently
   */
  static stringToUint8Array(str: string): Uint8Array {
    return this.textEncoder.encode(str);
  }

  /**
   * Find all occurrences of a pattern in a Uint8Array
   * More efficient than converting to string first
   */
  static findPatternInBytes(data: Uint8Array, pattern: Uint8Array): number[] {
    const positions: number[] = [];
    
    if (pattern.length === 0 || data.length < pattern.length) {
      return positions;
    }

    for (let i = 0; i <= data.length - pattern.length; i++) {
      let match = true;
      for (let j = 0; j < pattern.length; j++) {
        if (data[i + j] !== pattern[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        positions.push(i);
        i += pattern.length - 1; // Skip ahead to avoid overlapping matches
      }
    }

    return positions;
  }

  /**
   * Split Uint8Array by a delimiter byte
   */
  static splitByByte(data: Uint8Array, delimiter: number): Uint8Array[] {
    const chunks: Uint8Array[] = [];
    let start = 0;

    for (let i = 0; i < data.length; i++) {
      if (data[i] === delimiter) {
        if (i > start) {
          chunks.push(data.slice(start, i));
        }
        start = i + 1;
      }
    }

    // Add remaining data if any
    if (start < data.length) {
      chunks.push(data.slice(start));
    }

    return chunks;
  }

  /**
   * Extract number from bytes at position (optimized for graphing)
   */
  static extractFloat(data: Uint8Array, startPos: number): { value: number; length: number } | null {
    let pos = startPos;
    let hasDecimal = false;
    let hasDigits = false;
    
    // Skip whitespace
    while (pos < data.length && (data[pos] === 32 || data[pos] === 9)) {
      pos++;
    }
    
    const start = pos;
    
    // Handle negative sign
    if (pos < data.length && data[pos] === 45) { // '-'
      pos++;
    }
    
    // Parse digits and decimal point
    while (pos < data.length) {
      const byte = data[pos];
      if (byte >= 48 && byte <= 57) { // '0'-'9'
        hasDigits = true;
        pos++;
      } else if (byte === 46 && !hasDecimal) { // '.'
        hasDecimal = true;
        pos++;
      } else {
        break;
      }
    }
    
    if (!hasDigits) {
      return null;
    }
    
    // Convert to string and parse
    const numberStr = StringProcessor.uint8ArrayToString(data.slice(start, pos));
    const value = parseFloat(numberStr);
    
    return isNaN(value) ? null : { value, length: pos - startPos };
  }
}

export default BatchProcessor;