import { Checkbox, FormControlLabel, Tooltip, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography, Alert, TextField, IconButton, InputAdornment } from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useState, useRef } from "react";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import GeneralSettings from "src/model/Settings/GeneralSettings/GeneralSettings";
import { App, MainPanes } from "src/model/App";
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import SystemUpdateIcon from '@mui/icons-material/SystemUpdate';
import SpeedIcon from '@mui/icons-material/Speed';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DeveloperModeIcon from '@mui/icons-material/DeveloperMode';

import BorderedSection from "src/view/Components/BorderedSection";

interface Props {
  generalSettings: GeneralSettings;
  app: App;
}

function GeneralSettingsView(props: Props) {
  const { generalSettings, app } = props;
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleOpenConfirmDialog = () => {
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };

  const handleConfirmClearData = () => {
    generalSettings.clearAppDataAndRefresh();
    handleCloseConfirmDialog();
  };

  /**
   * This function is responsible for running the performance tests and
   * displaying the results.
   */
  const handleRunPerformanceTest = async () => {
    console.log('handleRunPerformanceTest() called.');
    generalSettings.setIsRunningPerformanceTest(true);
    generalSettings.setPerformanceTestResults(null);

    try {
      const results = await app.runPerformanceTests();
      // Fake results for now
      // const results = {
      //   summary: {
      //     overallHealthy: true,
      //     avgProcessingTime: 10,
      //     avgFrameRate: 60,
      //     maxDataRate: 1024,
      //     bottlenecks: [],
      //   },
      //   recommendations: [],
      //   testResults: []
      // };

      // Format results as a compact table
      const tableHeader = `Performance Test Results:

${'Test'.padEnd(30)} | ${'Target'.padEnd(8)} | ${'Actual'.padEnd(8)} | ${'Proc'.padEnd(7)} | ${'FPS'.padEnd(7)} | ${'CPU'.padEnd(4)} | Status
${'-'.repeat(30)} | ${'-'.repeat(8)} | ${'-'.repeat(8)} | ${'-'.repeat(7)} | ${'-'.repeat(7)} | ${'-'.repeat(4)} | ------`;

      const tableRows = results.testResults.map(r => {
        const testName = r.scenarioName.replace(' - Terminal View', '').replace(' - Graphing View', '').padEnd(30);
        const targetRate = `${(r.targetBytesPerSecond / 1024).toFixed(1)}KB/s`.padEnd(8);
        const actualRate = `${(r.actualBytesPerSecond / 1024).toFixed(1)}KB/s`.padEnd(8);
        const avgProc = `${r.avgProcessingTimeMs.toFixed(1)}ms`.padEnd(7);
        const frameRate = `${r.avgFrameRate.toFixed(0)}fps`.padEnd(7);
        const cpu = `${r.cpuUsagePercent.toFixed(0)}%`.padEnd(4);
        const health = r.isHealthy ? '✅ OK' : '⚠️ Poor';

        return `${testName} | ${targetRate} | ${actualRate} | ${avgProc} | ${frameRate} | ${cpu} | ${health}`;
      }).join('\n');

      const summary = `${tableHeader}\n${tableRows}`;

      console.log('Setting perf test results to:');
      console.log(summary);

      // Set results in MobX store - this will trigger reactive update
      generalSettings.setPerformanceTestResults(summary);

      // Also print results to console for debugging
      console.log('Performance Test Results:');
      console.log(summary);

      // Scroll to results after a short delay to ensure they're rendered
      setTimeout(() => {
        console.log('Attempting to scroll to results...');
        resultsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }, 100);
    } catch (error) {
      const errorMessage = `Error running performance tests: ${error}`;
      generalSettings.setPerformanceTestResults(errorMessage);
      console.error('Performance Test Error:', error);

      // Scroll to error results as well
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }, 100);
    } finally {
      generalSettings.setIsRunningPerformanceTest(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "start" }}>
      {/* =============================================================================== */}
      {/* COPY/PASTE SETTINGS */}
      {/* =============================================================================== */}
      <BorderedSection title="Copy/Paste Settings">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "800px",
          }}
        >
          <Tooltip
            title="The two common ways of new terminal rows being created is either by receiving a LF char, or by running out of columns in the terminal, and the text wrapping onto a new row. When enabled, LF will not be added to the clipboard if the row was created due to wrapping. You generally want this enabled so that you can paste large chunks of received data into an external program without getting new lines inserted where they weren't in the original data."
            placement="top"
            followCursor
            {...app.settings.displaySettings.getBasicTooltipConfig()}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={generalSettings.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping}
                  onChange={(e) => {
                    generalSettings.setWhenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping(e.target.checked);
                  }}
                  data-testid="do-not-add-lf-if-row-was-created-due-to-wrapping"
                />
              }
              label="When copying text from the terminal to the clipboard with Ctrl-Shift-C, do not insert LF into clipboard if row was created due to wrapping."
              sx={{ marginBottom: "10px" }}
            />
          </Tooltip>
          <Tooltip
            title="You usually want this enabled, as when copying text TO the clipboard on Windows, LF is automatically replaced with CRLF. So this will undo that operation when pasting, meaning you can copy terminal text and then paste it and get the same data."
            placement="top"
            followCursor
            {...app.settings.displaySettings.getBasicTooltipConfig()}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={generalSettings.whenPastingOnWindowsReplaceCRLFWithLF}
                  onChange={(e) => {
                    generalSettings.setWhenPastingOnWindowsReplaceCRLFWithLF(e.target.checked);
                  }}
                />
              }
              label="When pasting text from the clipboard into a terminal with Ctrl-Shift-V, convert CRLF to LF when on Windows."
              sx={{ marginBottom: "10px" }}
            />
          </Tooltip>
        </div>
      </BorderedSection>

      {/* =============================================================================== */}
      {/* APP UPDATES */}
      {/* =============================================================================== */}
      <BorderedSection title="App Updates">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Tooltip
            title="When enabled, NinjaTerm will automatically check for updates on startup. When disabled, you can still manually check for updates using the button below."
            placement="top"
            followCursor
            {...app.settings.displaySettings.getBasicTooltipConfig()}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={generalSettings.autoUpdatesEnabled}
                  onChange={(e) => {
                    generalSettings.setAutoUpdatesEnabled(e.target.checked);
                  }}
                  data-testid="auto-updates-enabled"
                />
              }
              label="Enable automatic updates"
              sx={{ marginBottom: "10px" }}
            />
          </Tooltip>
          <Button
            variant="outlined"
            size="large"
            startIcon={<SystemUpdateIcon />}
            onClick={() => app.checkForUpdates()}
            style={{ marginBottom: "10px", width: "300px" }}
          >
            Check for Updates
          </Button>
          <div style={{ fontSize: "0.875rem", color: "text.secondary", marginTop: "8px" }}>
            {generalSettings.autoUpdatesEnabled
              ? "NinjaTerm automatically checks for updates on startup. Click the button above to manually check for updates."
              : "Automatic updates are disabled. Click the button above to manually check for updates."
            }
          </div>
        </div>
      </BorderedSection>

      {/* =============================================================================== */}
      {/* MCP SERVER */}
      {/* =============================================================================== */}
      <BorderedSection title="MCP Server (AI Integration)">
        <div style={{ display: 'flex', flexDirection: 'column', width: '700px' }}>
          <Typography variant="body2" color="text.secondary" sx={{ marginBottom: '12px' }}>
            Expose NinjaTerm as an MCP (Model Context Protocol) server so AI assistants like Claude Code
            can read serial output and send commands directly — no copy-pasting required.
          </Typography>

          <Tooltip
            title="When enabled, NinjaTerm starts a local HTTP server that AI tools can connect to. The server only accepts connections from 127.0.0.1 (this machine)."
            placement="top"
            followCursor
            {...app.settings.displaySettings.getBasicTooltipConfig()}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={generalSettings.mcpEnabled}
                  onChange={(e) => generalSettings.setMcpEnabled(e.target.checked)}
                />
              }
              label="Enable MCP server"
              sx={{ marginBottom: '8px' }}
            />
          </Tooltip>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <TextField
              label="Port"
              type="number"
              size="small"
              value={generalSettings.mcpPort}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val > 0 && val < 65536) {
                  generalSettings.setMcpPort(val);
                }
              }}
              inputProps={{ min: 1024, max: 65535 }}
              style={{ width: '120px' }}
              disabled={!generalSettings.mcpEnabled}
            />
            {generalSettings.mcpEnabled && (
              <Typography variant="body2" color="success.main">
                Running on http://127.0.0.1:{generalSettings.mcpPort}/mcp
              </Typography>
            )}
          </div>

          {generalSettings.mcpEnabled && (
            <div>
              <Typography variant="body2" color="text.secondary" sx={{ marginBottom: '4px' }}>
                Add to Claude Code with:
              </Typography>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Typography
                  variant="body2"
                  component="code"
                  sx={{
                    fontFamily: 'Consolas, monospace',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                  }}
                >
                  {`claude mcp add --transport http ninjaterm http://127.0.0.1:${generalSettings.mcpPort}/mcp`}
                </Typography>
                <Tooltip title="Copy command" placement="top" {...app.settings.displaySettings.getBasicTooltipConfig()}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `claude mcp add --transport http ninjaterm http://127.0.0.1:${generalSettings.mcpPort}/mcp`
                      );
                    }}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </div>
              <Typography variant="caption" color="text.secondary" sx={{ marginTop: '8px', display: 'block' }}>
                Available tools: <code>get_terminal_output</code>, <code>send_data</code>, <code>get_connection_status</code>, <code>list_available_ports</code>
              </Typography>
            </div>
          )}
        </div>
      </BorderedSection>

      {/* =============================================================================== */}
      {/* PERFORMANCE TESTING */}
      {/* =============================================================================== */}
      <BorderedSection title="Performance Testing">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ marginBottom: "16px" }}>
            Run comprehensive performance tests to measure data processing speed, rendering performance,
            and identify bottlenecks. Tests automatically switch between Terminal and Graphing views
            for accurate measurements of view-specific rendering performance.
          </Typography>

          <div style={{ display: "flex", gap: "12px", marginBottom: "10px", flexDirection: "column" }}>
            <Button
              variant="outlined"
              size="medium"
              startIcon={<SpeedIcon />}
              onClick={handleRunPerformanceTest}
              disabled={generalSettings.isRunningPerformanceTest}
              style={{ width: "300px" }}
            >
              {generalSettings.isRunningPerformanceTest ? "Running Tests..." : "Run Performance Tests"}
            </Button>

            <Button
              variant="outlined"
              size="medium"
              startIcon={<AssessmentIcon />}
              onClick={() => {
                const report = app.getPerformanceReport();
                generalSettings.setPerformanceTestResults(report);
              }}
              style={{ width: "300px" }}
            >
              Show Current Metrics
            </Button>
          </div>

          {generalSettings.isRunningPerformanceTest && (
            <Alert severity="info" sx={{ marginBottom: "16px" }}>
              Running performance tests... This will take about 30 seconds and will automatically
              switch between Terminal and Graphing views to measure rendering performance accurately.
              The Settings dialog will be closed during testing to prevent MUI component render overhead.
            </Alert>
          )}

          {generalSettings.performanceTestResults && (
            <Alert
              ref={resultsRef}
              severity={generalSettings.performanceTestResults.includes('✅ OK') ? "success" : "warning"}
              sx={{ marginBottom: "16px", maxWidth: "100%", overflow: "auto" }}
            >
              <Typography variant="body2" component="pre" style={{
                whiteSpace: 'pre',
                fontFamily: 'Consolas, "Courier New", monospace',
                fontSize: '13px',
                lineHeight: '1.4',
                overflow: 'auto',
                margin: 0
              }}>
                {generalSettings.performanceTestResults}
              </Typography>
            </Alert>
          )}

          <Typography variant="caption" color="text.secondary">
            Performance tests measure view-specific rendering costs by automatically switching between
            Terminal and Graphing views. Terminal tests measure text rendering and ANSI processing,
            while Graphing tests measure chart.js performance and data parsing overhead.
          </Typography>
        </div>
      </BorderedSection>

      {/* =============================================================================== */}
      {/* DEVELOPER TOOLS */}
      {/* =============================================================================== */}
      <BorderedSection title="Developer Tools">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ marginBottom: "16px" }}>
            Open Chrome Developer Tools to inspect the application, debug JavaScript, analyze performance,
            and examine network requests. The dev tools can also be opened by pressing F12.
          </Typography>

          <Button
            variant="outlined"
            size="large"
            startIcon={<DeveloperModeIcon />}
            onClick={() => app.toggleDevTools()}
            style={{ marginBottom: "10px", width: "300px" }}
          >
            Open Developer Tools
          </Button>

          <Typography variant="caption" color="text.secondary">
            Note: Developer tools are available in both development and production builds.
            Use them to debug performance issues, inspect React components, and analyze the application.
          </Typography>
        </div>
      </BorderedSection>

      {/* =============================================================================== */}
      {/* APP DATA */}
      {/* =============================================================================== */}
      <BorderedSection title="App Data">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "600px",
          }}
        >
          <Button variant="outlined" size="large" startIcon={<DeleteForeverIcon />} onClick={handleOpenConfirmDialog} color="error" style={{ width: "500px" }}>
            Clear app data and reload app
          </Button>
        </div>
      </BorderedSection>

      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirm Action"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to clear all app data and reload?<br/>
            <br/>
            You will lose all profiles and all settings will be reset to default. Logged data saved to disk will NOT be deleted.<br/>
            <br/>
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>
            Cancel
          </Button>
          <Button onClick={handleConfirmClearData} color="error" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default observer(GeneralSettingsView);
