import { makeAutoObservable } from 'mobx';

/**
 * Performance monitoring utility to track data processing bottlenecks
 * and provide real-time metrics for optimization.
 */
export class PerformanceMonitor {
  // Performance metrics
  dataProcessingTimeMs: number = 0;
  terminalRenderTimeMs: number = 0;
  graphingProcessingTimeMs: number = 0;
  totalDataThroughputBps: number = 0;
  
  // Processing pipeline timing
  private measurements: Map<string, number> = new Map();
  private readonly METRICS_WINDOW_MS = 5000; // 5 second window for averages
  private metricsHistory: Array<{
    timestamp: number;
    dataProcessingTime: number;
    terminalRenderTime: number;
    graphingProcessingTime: number;
    bytesProcessed: number;
  }> = [];

  // Frame rate monitoring
  frameRate: number = 60;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private frameRateStartTime: number = 0;

  constructor() {
    makeAutoObservable(this);
    this.startFrameRateMonitoring();
  }

  /**
   * Start timing a specific operation
   */
  startTiming(operationName: string): void {
    this.measurements.set(operationName, performance.now());
  }

  /**
   * End timing and record the duration
   */
  endTiming(operationName: string): number {
    const startTime = this.measurements.get(operationName);
    if (startTime === undefined) {
      console.warn(`No start time found for operation: ${operationName}`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.measurements.delete(operationName);
    
    // Update relevant metrics
    switch (operationName) {
      case 'dataProcessing':
        this.dataProcessingTimeMs = duration;
        break;
      case 'terminalRender':
        this.terminalRenderTimeMs = duration;
        break;
      case 'graphingProcessing':
        this.graphingProcessingTimeMs = duration;
        break;
    }
    
    return duration;
  }

  /**
   * Record data processing metrics for a batch of data
   */
  recordDataProcessing(bytesProcessed: number, processingTimeMs: number): void {
    const now = Date.now();
    
    // Add to history
    this.metricsHistory.push({
      timestamp: now,
      dataProcessingTime: processingTimeMs,
      terminalRenderTime: this.terminalRenderTimeMs,
      graphingProcessingTime: this.graphingProcessingTimeMs,
      bytesProcessed
    });

    // Clean old entries outside the window
    const cutoffTime = now - this.METRICS_WINDOW_MS;
    this.metricsHistory = this.metricsHistory.filter(entry => entry.timestamp > cutoffTime);

    // Calculate throughput
    const totalBytes = this.metricsHistory.reduce((sum, entry) => sum + entry.bytesProcessed, 0);
    const timeSpanMs = this.metricsHistory.length > 0 
      ? now - this.metricsHistory[0].timestamp 
      : 1;
    
    this.totalDataThroughputBps = (totalBytes / timeSpanMs) * 1000;
  }

  /**
   * Get average processing times over the current window
   */
  getAverageMetrics() {
    if (this.metricsHistory.length === 0) {
      return {
        avgDataProcessingTime: 0,
        avgTerminalRenderTime: 0,
        avgGraphingProcessingTime: 0,
        totalSamples: 0
      };
    }

    const totalSamples = this.metricsHistory.length;
    const avgDataProcessingTime = this.metricsHistory.reduce((sum, entry) => 
      sum + entry.dataProcessingTime, 0) / totalSamples;
    const avgTerminalRenderTime = this.metricsHistory.reduce((sum, entry) => 
      sum + entry.terminalRenderTime, 0) / totalSamples;
    const avgGraphingProcessingTime = this.metricsHistory.reduce((sum, entry) => 
      sum + entry.graphingProcessingTime, 0) / totalSamples;

    return {
      avgDataProcessingTime,
      avgTerminalRenderTime,
      avgGraphingProcessingTime,
      totalSamples
    };
  }

  /**
   * Start monitoring frame rate
   */
  private startFrameRateMonitoring(): void {
    this.frameRateStartTime = performance.now();
    this.lastFrameTime = this.frameRateStartTime;
    
    const measureFrameRate = () => {
      const now = performance.now();
      this.frameCount++;
      
      // Update frame rate every second
      if (now - this.frameRateStartTime >= 1000) {
        this.frameRate = this.frameCount;
        this.frameCount = 0;
        this.frameRateStartTime = now;
      }
      
      this.lastFrameTime = now;
      requestAnimationFrame(measureFrameRate);
    };
    
    requestAnimationFrame(measureFrameRate);
  }

  /**
   * Check if performance is within acceptable thresholds
   */
  isPerformanceHealthy(): boolean {
    const avgMetrics = this.getAverageMetrics();
    return (
      avgMetrics.avgDataProcessingTime < 5 && // Less than 5ms per processing cycle
      this.frameRate > 45 && // Maintain at least 45fps
      this.totalDataThroughputBps < 50000 // Less than 50KB/s processing overhead
    );
  }

  /**
   * Get a performance report for debugging
   */
  getPerformanceReport(): string {
    const avgMetrics = this.getAverageMetrics();
    return `
Performance Report:
- Frame Rate: ${this.frameRate.toFixed(1)} fps
- Data Throughput: ${(this.totalDataThroughputBps / 1000).toFixed(2)} KB/s
- Avg Data Processing: ${avgMetrics.avgDataProcessingTime.toFixed(2)} ms
- Avg Terminal Render: ${avgMetrics.avgTerminalRenderTime.toFixed(2)} ms
- Avg Graphing Processing: ${avgMetrics.avgGraphingProcessingTime.toFixed(2)} ms
- Health Status: ${this.isPerformanceHealthy() ? 'Healthy' : 'Degraded'}
- Samples: ${avgMetrics.totalSamples}
    `;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.dataProcessingTimeMs = 0;
    this.terminalRenderTimeMs = 0;
    this.graphingProcessingTimeMs = 0;
    this.totalDataThroughputBps = 0;
    this.metricsHistory = [];
    this.measurements.clear();
  }
}

export default PerformanceMonitor;