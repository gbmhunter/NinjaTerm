import { App, MainPanes } from '../App';
import DataGenerator from './DataGenerator';
import { DetectionMode } from '../Graphing/Graphing';

/**
 * Performance testing utility to measure NinjaTerm's baseline performance
 * and validate improvements.
 */
export class PerformanceTester {
  private app: App;
  private results: PerformanceTestResult[] = [];

  constructor(app: App) {
    this.app = app;
  }

  /**
   * Run a comprehensive performance test suite
   */
  async runFullTestSuite(): Promise<PerformanceTestSuiteResult> {
    console.log('🚀 Starting NinjaTerm Performance Test Suite...');
    console.log('📌 Important: Performance tests will automatically switch views for accurate measurements');

    const suiteStartTime = Date.now();
    this.results = [];

    // Test different scenarios with specific UI requirements and setup functions
    const scenarios = [
      {
        name: 'ASCII Text - 1KB/s',
        bytesPerSecond: 1024,
        duration: 8000,
        dataGenerator: () => DataGenerator.generateAsciiData(100, 'mixed'),
        requiredView: 'terminal',
        description: 'Tests terminal rendering performance with mixed ASCII text',
        setup: this.setupTerminalTest.bind(this),
        teardown: this.teardownTerminalTest.bind(this)
      },
      {
        name: 'ANSI Colors - 3KB/s',
        bytesPerSecond: 3072,
        duration: 8000,
        dataGenerator: () => DataGenerator.generateAnsiData(150),
        requiredView: 'terminal',
        description: 'Tests terminal performance with ANSI escape codes and colors',
        setup: this.setupTerminalTest.bind(this),
        teardown: this.teardownTerminalTest.bind(this)
      },
      {
        name: 'High Rate ASCII - 10KB/s',
        bytesPerSecond: 10240,
        duration: 8000,
        dataGenerator: () => DataGenerator.generateAsciiData(200, 'random'),
        requiredView: 'terminal',
        description: 'Stress tests terminal at high data rates',
        setup: this.setupTerminalTest.bind(this),
        teardown: this.teardownTerminalTest.bind(this)
      },
      {
        name: 'Plot Commands - 1kB/s (Normal)',
        bytesPerSecond: 1024,
        duration: 8000,
        dataGenerator: () => DataGenerator.generatePlotDataCommands(2), // Only DATA commands during test
        requiredView: 'graphing',
        description: 'Tests advanced plotting commands and chart rendering',
        setup: async (): Promise<TestSetupState> => {
          const previousView = this.app.shownMainPane;
          const previousGraphingEnabled = this.app.graphing.graphingEnabled;
          const previousGraphingMode = this.app.graphing.detectionMode === DetectionMode.BASIC_PREFIX ? 'basic' : 'advanced';
          const settingsWereOpen = previousView === MainPanes.SETTINGS;

          console.log(`Setting up advanced cmd mode graphing test...`);

          // Enable graphing for chart rendering performance measurement
          if (!this.app.graphing.graphingEnabled) {
            this.app.graphing.setGraphingEnabled(true);
          }

          // Set to advanced cmd mode
          this.app.graphing.setDetectionMode(DetectionMode.ADVANCED_CMD);
          // Switch to graphing view
          this.app.setShownMainPane(MainPanes.GRAPHING);

          // Create plots and traces in setup (like a user would do)
          const createCommands = [
            '#PLOT:CREATE,id=plot0,title="Performance Test Plot 0",xlabel="Time",ylabel="Value";\n',
            '#PLOT:TRACE,plot=plot0,id=trace0,name="Trace 0",color=#ff0000,xtype=timestamp;\n',
            '#PLOT:CREATE,id=plot1,title="Performance Test Plot 1",xlabel="Time",ylabel="Value";\n',
            '#PLOT:TRACE,plot=plot1,id=trace1,name="Trace 1",color=#00ff00,xtype=timestamp;\n'
          ];

          console.log(`Creating ${createCommands.length} plots and traces...`);

          // Send each command to create plots and traces
          for (const command of createCommands) {
            const data = new TextEncoder().encode(command);
            this.app.parseRxData(data);
          }

          return {
            previousView,
            previousGraphingEnabled,
            previousGraphingMode,
            settingsWereOpen
          };
        },
        teardown: async (setupState: TestSetupState): Promise<void> => {
          console.log(`Tearing down advanced cmd mode graphing test...`);

          // Restore graphing mode
          if (setupState.previousGraphingMode === 'basic') {
            this.app.graphing.setDetectionMode(DetectionMode.BASIC_PREFIX);
          }

          // Restore graphing state
          if (!setupState.previousGraphingEnabled && this.app.graphing.graphingEnabled) {
            this.app.graphing.setGraphingEnabled(false);
          }

          // Restore previous view
          this.app.setShownMainPane(setupState.previousView);
        }
      },
      {
        name: 'Plot Commands - 10kB/s (Fast)',
        bytesPerSecond: 10240,
        duration: 8000,
        dataGenerator: () => DataGenerator.generatePlotDataCommands(2), // Only DATA commands during test
        requiredView: 'graphing',
        description: 'Tests advanced plotting commands and chart rendering',
        setup: async (): Promise<TestSetupState> => {
          const previousView = this.app.shownMainPane;
          const previousGraphingEnabled = this.app.graphing.graphingEnabled;
          const previousGraphingMode = this.app.graphing.detectionMode === DetectionMode.BASIC_PREFIX ? 'basic' : 'advanced';
          const settingsWereOpen = previousView === MainPanes.SETTINGS;

          console.log(`Setting up advanced cmd mode graphing test...`);

          // Enable graphing for chart rendering performance measurement
          if (!this.app.graphing.graphingEnabled) {
            this.app.graphing.setGraphingEnabled(true);
          }

          // Set to advanced cmd mode
          this.app.graphing.setDetectionMode(DetectionMode.ADVANCED_CMD);
          // Switch to graphing view
          this.app.setShownMainPane(MainPanes.GRAPHING);

          // Create plots and traces in setup (like a user would do)
          const createCommands = [
            '#PLOT:CREATE,id=plot0,title="High Rate Test Plot 0",xlabel="Time",ylabel="Value";\n',
            '#PLOT:TRACE,plot=plot0,id=trace0,name="High Rate Trace 0",color=#ff0000,xtype=timestamp;\n',
            '#PLOT:CREATE,id=plot1,title="High Rate Test Plot 1",xlabel="Time",ylabel="Value";\n',
            '#PLOT:TRACE,plot=plot1,id=trace1,name="High Rate Trace 1",color=#00ff00,xtype=timestamp;\n'
          ];

          console.log(`Creating ${createCommands.length} plots and traces for high-rate test...`);

          // Send each command to create plots and traces
          for (const command of createCommands) {
            const data = new TextEncoder().encode(command);
            this.app.parseRxData(data);
          }

          return {
            previousView,
            previousGraphingEnabled,
            previousGraphingMode,
            settingsWereOpen
          };
        },
        teardown: async (setupState: TestSetupState): Promise<void> => {
          console.log(`Tearing down advanced cmd mode graphing test...`);

          // Restore graphing mode
          if (setupState.previousGraphingMode === 'basic') {
            this.app.graphing.setDetectionMode(DetectionMode.BASIC_PREFIX);
          }

          // Restore graphing state
          if (!setupState.previousGraphingEnabled && this.app.graphing.graphingEnabled) {
            this.app.graphing.setGraphingEnabled(false);
          }

          // Restore previous view
          this.app.setShownMainPane(setupState.previousView);
        }
      }
    ];

    for (const scenario of scenarios) {
      console.log(`📊 Testing: ${scenario.name}`);
      console.log(`   ${scenario.description}`);
      console.log(`   Required view: ${scenario.requiredView}`);

      const result = await this.runSingleTest(scenario);
      this.results.push(result);

      // Wait between tests to let system settle
      await this.delay(1000);
    }

    const suiteEndTime = Date.now();
    const totalDuration = suiteEndTime - suiteStartTime;

    const suiteResult: PerformanceTestSuiteResult = {
      totalDuration,
      testResults: this.results,
      summary: this.generateSummary(),
      recommendations: this.generateRecommendations()
    };

    this.printResults(suiteResult);
    return suiteResult;
  }

  /**
   * Run a single performance test scenario
   */
  private async runSingleTest(scenario: {
    name: string;
    bytesPerSecond: number;
    duration: number;
    dataGenerator: () => Uint8Array;
    requiredView: string;
    description: string;
    setup: () => Promise<TestSetupState>;
    teardown: (setupState: TestSetupState) => Promise<void>;
  }): Promise<PerformanceTestResult> {

    // Reset performance monitor
    this.app.performanceMonitor.reset();

    // Run test-specific setup
    const setupState = await scenario.setup();

    // Wait a moment for view and settings to stabilize
    await this.delay(500);

    // Clear terminal and graphing data to start fresh
    this.app.terminals.txRxTerminal.clear();
    this.app.graphing.resetData();

    const startTime = Date.now();
    let totalBytesProcessed = 0;
    const processingTimes: number[] = [];
    const frameRates: number[] = [];

    // Create data stream
    const dataStream = DataGenerator.createDataStream(
      scenario.dataGenerator,
      (data: Uint8Array) => {
        const processStart = performance.now();
        this.app.parseRxData(data);
        const processTime = performance.now() - processStart;

        processingTimes.push(processTime);
        totalBytesProcessed += data.length;
        frameRates.push(this.app.performanceMonitor.frameRate);
      },
      scenario.bytesPerSecond,
      64 // Fixed 64-byte chunks - let the data stream handle rate control
    );

    // Start the test
    dataStream.start();

    // Let it run for the specified duration
    await this.delay(scenario.duration);

    // Stop the test
    dataStream.stop();

    const endTime = Date.now();
    const actualDuration = endTime - startTime;
    const dataStreamStats = dataStream.getStats();

    // Get performance metrics
    const avgMetrics = this.app.performanceMonitor.getAverageMetrics();
    const finalFrameRate = this.app.performanceMonitor.frameRate;

    // Calculate statistics
    const avgProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
      : 0;

    const maxProcessingTime = processingTimes.length > 0
      ? Math.max(...processingTimes)
      : 0;

    const avgFrameRate = frameRates.length > 0
      ? frameRates.reduce((a, b) => a + b, 0) / frameRates.length
      : 60;

    const minFrameRate = frameRates.length > 0
      ? Math.min(...frameRates)
      : 60;

    // Run test-specific teardown to restore state
    await scenario.teardown(setupState);

    return {
      scenarioName: scenario.name,
      targetBytesPerSecond: scenario.bytesPerSecond,
      actualBytesPerSecond: dataStreamStats.actualBytesPerSecond,
      duration: actualDuration,
      totalBytesProcessed,
      avgProcessingTimeMs: avgProcessingTime,
      maxProcessingTimeMs: maxProcessingTime,
      avgDataProcessingTimeMs: avgMetrics.avgDataProcessingTime,
      avgTerminalRenderTimeMs: avgMetrics.avgTerminalRenderTime,
      avgGraphingProcessingTimeMs: avgMetrics.avgGraphingProcessingTime,
      avgFrameRate,
      minFrameRate,
      finalFrameRate,
      cpuUsagePercent: this.app.cpuUsagePercent,
      isHealthy: this.app.performanceMonitor.isPerformanceHealthy(),
      samples: avgMetrics.totalSamples
    };
  }

  /**
   * Generate performance summary
   */
  private generateSummary(): PerformanceSummary {
    if (this.results.length === 0) {
      return {
        overallHealthy: false,
        avgProcessingTime: 0,
        avgFrameRate: 0,
        maxDataRate: 0,
        bottlenecks: ['No test results available']
      };
    }

    const avgProcessingTime = this.results.reduce((sum, r) => sum + r.avgProcessingTimeMs, 0) / this.results.length;
    const avgFrameRate = this.results.reduce((sum, r) => sum + r.avgFrameRate, 0) / this.results.length;
    const maxDataRate = Math.max(...this.results.map(r => r.actualBytesPerSecond));
    const overallHealthy = this.results.every(r => r.isHealthy);

    // Identify bottlenecks
    const bottlenecks: string[] = [];

    if (avgFrameRate < 50) {
      bottlenecks.push('Low frame rate indicates rendering bottleneck');
    }

    if (avgProcessingTime > 10) {
      bottlenecks.push('High processing time indicates data processing bottleneck');
    }

    const highCpuResults = this.results.filter(r => r.cpuUsagePercent > 80);
    if (highCpuResults.length > 0) {
      bottlenecks.push('High CPU usage detected in some scenarios');
    }

    const slowGraphingResults = this.results.filter(r => r.avgGraphingProcessingTimeMs > 5);
    if (slowGraphingResults.length > 0) {
      bottlenecks.push('Graphing processing is slow');
    }

    return {
      overallHealthy,
      avgProcessingTime,
      avgFrameRate,
      maxDataRate,
      bottlenecks
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const summary = this.generateSummary();

    if (summary.avgFrameRate < 50) {
      recommendations.push('Consider implementing frame rate limiting and debounced rendering');
    }

    if (summary.avgProcessingTime > 10) {
      recommendations.push('Implement batch processing to reduce per-byte overhead');
    }

    if (summary.bottlenecks.includes('Graphing processing is slow')) {
      recommendations.push('Optimize graphing data parsing with buffered processing');
    }

    if (summary.bottlenecks.includes('High CPU usage detected in some scenarios')) {
      recommendations.push('Consider moving heavy processing to Web Workers');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance appears healthy - focus on stress testing and edge cases');
    }

    return recommendations;
  }

  /**
   * Print formatted results to console
   */
  private printResults(suite: PerformanceTestSuiteResult): void {
    console.log('\n📈 PERFORMANCE TEST RESULTS');
    console.log('=' .repeat(50));

    suite.testResults.forEach(result => {
      console.log(`\n🔍 ${result.scenarioName}`);
      console.log(`   Target Rate: ${(result.targetBytesPerSecond / 1024).toFixed(1)} KB/s`);
      console.log(`   Actual Rate: ${(result.actualBytesPerSecond / 1024).toFixed(1)} KB/s`);
      console.log(`   Avg Processing: ${result.avgProcessingTimeMs.toFixed(2)}ms`);
      console.log(`   Frame Rate: ${result.avgFrameRate.toFixed(1)} fps (min: ${result.minFrameRate.toFixed(1)})`);
      console.log(`   CPU Usage: ${result.cpuUsagePercent.toFixed(1)}%`);
      console.log(`   Health: ${result.isHealthy ? '✅ Healthy' : '⚠️  Degraded'}`);
    });

    console.log('\n📊 SUMMARY');
    console.log(`   Overall Health: ${suite.summary.overallHealthy ? '✅ Healthy' : '⚠️  Needs Attention'}`);
    console.log(`   Avg Processing Time: ${suite.summary.avgProcessingTime.toFixed(2)}ms`);
    console.log(`   Avg Frame Rate: ${suite.summary.avgFrameRate.toFixed(1)} fps`);
    console.log(`   Max Data Rate: ${(suite.summary.maxDataRate / 1024).toFixed(1)} KB/s`);

    if (suite.summary.bottlenecks.length > 0) {
      console.log('\n⚠️  BOTTLENECKS IDENTIFIED:');
      suite.summary.bottlenecks.forEach(bottleneck => {
        console.log(`   • ${bottleneck}`);
      });
    }

    console.log('\n💡 RECOMMENDATIONS:');
    suite.recommendations.forEach(rec => {
      console.log(`   • ${rec}`);
    });

    console.log('\n' + '='.repeat(50));
  }

  /**
   * Setup for terminal tests - disable graphing and ensure terminal view
   */
  private async setupTerminalTest(): Promise<TestSetupState> {
    const previousView = this.app.shownMainPane;
    const previousGraphingEnabled = this.app.graphing.graphingEnabled;
    const settingsWereOpen = previousView === MainPanes.SETTINGS;

    console.log(`   🔧 Setting up terminal test...`);

    // Disable graphing for pure terminal performance measurement
    if (this.app.graphing.graphingEnabled) {
      this.app.graphing.setGraphingEnabled(false);
      console.log(`   📊 Disabled graphing for terminal test`);
    }

    // Switch to terminal view
    this.app.setShownMainPane(MainPanes.TERMINAL);
    console.log(`   📺 Switched to Terminal view`);

    if (settingsWereOpen) {
      console.log(`   🚪 Closed Settings dialog to prevent MUI component render overhead`);
    }

    return {
      previousView,
      previousGraphingEnabled,
      settingsWereOpen
    };
  }

  /**
   * Teardown for terminal tests - restore previous state
   */
  private async teardownTerminalTest(setupState: TestSetupState): Promise<void> {
    console.log(`   🔧 Tearing down terminal test...`);

    // Restore graphing state
    if (setupState.previousGraphingEnabled && !this.app.graphing.graphingEnabled) {
      this.app.graphing.setGraphingEnabled(true);
      console.log(`   📊 Restored graphing to enabled state`);
    }

    // Restore previous view
    this.app.setShownMainPane(setupState.previousView);
    console.log(`   📺 Restored view to ${MainPanes[setupState.previousView]}`);
  }

  /**
   * Setup for graphing tests - enable graphing and ensure graphing view
   */
  private async setupGraphingTest(): Promise<TestSetupState> {
    const previousView = this.app.shownMainPane;
    const previousGraphingEnabled = this.app.graphing.graphingEnabled;
    const settingsWereOpen = previousView === MainPanes.SETTINGS;

    console.log(`   🔧 Setting up graphing test...`);

    // Enable graphing for chart rendering performance measurement
    if (!this.app.graphing.graphingEnabled) {
      this.app.graphing.setGraphingEnabled(true);
      console.log(`   📊 Enabled graphing for graphing test`);
    }

    // Switch to graphing view
    this.app.setShownMainPane(MainPanes.GRAPHING);
    console.log(`   📈 Switched to Graphing view for chart rendering measurements`);

    if (settingsWereOpen) {
      console.log(`   🚪 Closed Settings dialog to prevent MUI component render overhead`);
    }

    return {
      previousView,
      previousGraphingEnabled,
      settingsWereOpen
    };
  }

  /**
   * Teardown for graphing tests - restore previous state
   */
  private async teardownGraphingTest(setupState: TestSetupState): Promise<void> {
    console.log(`   🔧 Tearing down graphing test...`);

    // Restore graphing state
    if (!setupState.previousGraphingEnabled && this.app.graphing.graphingEnabled) {
      this.app.graphing.setGraphingEnabled(false);
      console.log(`   📊 Restored graphing to disabled state`);
    }

    // Restore previous view
    this.app.setShownMainPane(setupState.previousView);
    console.log(`   📺 Restored view to ${MainPanes[setupState.previousView]}`);
  }

  /**
   * Utility to wait/delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Type definitions
export interface TestSetupState {
  previousView: MainPanes;
  previousGraphingEnabled: boolean;
  previousGraphingMode?: 'basic' | 'advanced';
  settingsWereOpen: boolean;
}

export interface PerformanceTestResult {
  scenarioName: string;
  targetBytesPerSecond: number;
  actualBytesPerSecond: number;
  duration: number;
  totalBytesProcessed: number;
  avgProcessingTimeMs: number;
  maxProcessingTimeMs: number;
  avgDataProcessingTimeMs: number;
  avgTerminalRenderTimeMs: number;
  avgGraphingProcessingTimeMs: number;
  avgFrameRate: number;
  minFrameRate: number;
  finalFrameRate: number;
  cpuUsagePercent: number;
  isHealthy: boolean;
  samples: number;
}

export interface PerformanceSummary {
  overallHealthy: boolean;
  avgProcessingTime: number;
  avgFrameRate: number;
  maxDataRate: number;
  bottlenecks: string[];
}

export interface PerformanceTestSuiteResult {
  totalDuration: number;
  testResults: PerformanceTestResult[];
  summary: PerformanceSummary;
  recommendations: string[];
}

export default PerformanceTester;
