import { Checkbox, FormControlLabel, Tooltip, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography, Alert } from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import GeneralSettings from "src/model/Settings/GeneralSettings/GeneralSettings";
import { App } from "src/model/App";
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
  const [isRunningPerfTest, setIsRunningPerfTest] = useState(false);
  const [perfTestResults, setPerfTestResults] = useState<string | null>(null);

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

  const handleRunPerformanceTest = async () => {
    setIsRunningPerfTest(true);
    setPerfTestResults(null);
    
    try {
      const results = await app.runPerformanceTests();
      
      // Format results for display
      const summary = `Performance Test Results:
- Overall Health: ${results.summary.overallHealthy ? 'Healthy ✅' : 'Needs Attention ⚠️'}
- Average Processing Time: ${results.summary.avgProcessingTime.toFixed(2)}ms
- Average Frame Rate: ${results.summary.avgFrameRate.toFixed(1)} fps
- Max Data Rate Tested: ${(results.summary.maxDataRate / 1024).toFixed(1)} KB/s

Bottlenecks Found: ${results.summary.bottlenecks.length}
${results.summary.bottlenecks.map(b => '• ' + b).join('\n')}

Recommendations:
${results.recommendations.map(r => '• ' + r).join('\n')}

Test Details:
${results.testResults.map(r => 
  `• ${r.scenarioName}: ${r.avgProcessingTimeMs.toFixed(2)}ms avg, ${r.avgFrameRate.toFixed(1)} fps, ${r.isHealthy ? 'Healthy' : 'Degraded'}`
).join('\n')}`;

      setPerfTestResults(summary);
    } catch (error) {
      setPerfTestResults(`Error running performance tests: ${error}`);
    } finally {
      setIsRunningPerfTest(false);
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
            width: "600px",
          }}
        >
          <Tooltip
            title="The two common ways of new terminal rows being created is either by receiving a LF char, or by running out of columns in the terminal, and the text wrapping onto a new row. When enabled, LF will not be added to the clipboard if the row was created due to wrapping. You generally want this enabled so that you can paste large chunks of received data into an external program without getting new lines inserted where they weren't in the original data."
            placement="top"
            followCursor
            arrow
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
            arrow
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
            width: "600px",
          }}
        >
          <Tooltip
            title="When enabled, NinjaTerm will automatically check for updates on startup. When disabled, you can still manually check for updates using the button below."
            placement="top"
            followCursor
            arrow
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
      {/* PERFORMANCE TESTING */}
      {/* =============================================================================== */}
      <BorderedSection title="Performance Testing">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "600px",
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ marginBottom: "16px" }}>
            Run comprehensive performance tests to measure data processing speed, rendering performance, 
            and identify bottlenecks. Tests automatically switch between Terminal and Graphing views 
            for accurate measurements of view-specific rendering performance.
          </Typography>
          
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
            <Button
              variant="outlined"
              size="large"
              startIcon={<SpeedIcon />}
              onClick={handleRunPerformanceTest}
              disabled={isRunningPerfTest}
              style={{ width: "200px" }}
            >
              {isRunningPerfTest ? "Running Tests..." : "Run Performance Tests"}
            </Button>
            
            <Button
              variant="text"
              size="large"
              startIcon={<AssessmentIcon />}
              onClick={() => {
                const report = app.getPerformanceReport();
                setPerfTestResults(report);
              }}
              style={{ width: "200px" }}
            >
              Show Current Metrics
            </Button>
          </div>

          {isRunningPerfTest && (
            <Alert severity="info" sx={{ marginBottom: "16px" }}>
              Running performance tests... This will take about 30 seconds and will automatically 
              switch between Terminal and Graphing views to measure rendering performance accurately. 
              The Settings dialog will be closed during testing to prevent MUI component render overhead.
            </Alert>
          )}

          {perfTestResults && (
            <Alert 
              severity={perfTestResults.includes('Healthy ✅') ? "success" : "warning"} 
              sx={{ marginBottom: "16px" }}
            >
              <Typography variant="body2" component="pre" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                {perfTestResults}
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
            width: "600px",
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
            style={{ marginBottom: "10px", width: "250px" }}
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
