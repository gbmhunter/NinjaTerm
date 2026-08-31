import { IconButton, InputBase, Tooltip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';

import { App } from 'src/model/App';
import { ConnState } from 'src/model/Settings/PortSettings/PortSettings';
import { TxMode } from 'src/model/Settings/TxSettings/TxSettings';
import { TX_LINE_BAR_INPUT_ID, focusOuterBorder } from 'src/model/TxLine/TxLineController';

interface Props {
  app: App;
}

/**
 * The TX line bar, shown under the terminal panes when TX mode is set to Line.
 *
 * The line is composed here rather than in the terminal grid so that the caret,
 * selection, Home/End, insert-mid-string and clipboard all come from the
 * browser. It also means nothing is drawn before sending, so the existing
 * post-transmit echo in `App.writeBytesToSerialPort` needs no special case.
 *
 * Keyboard:
 *   Enter      - send the line as a single write
 *   Up / Down  - walk the history of previously sent lines
 *   Esc        - clear the line
 */
export default observer((props: Props) => {
  const { app } = props;

  const inputRef = useRef<HTMLInputElement>(null);
  const isLineMode = app.settings.txSettings.txMode === TxMode.LINE;

  // Take focus when line mode turns on, and hand it back to #outer-border when
  // it turns off. Without the handback, focus falls to document.body (outside
  // #outer-border) and the terminal stops receiving keystrokes entirely until
  // the user clicks somewhere in the app.
  useEffect(() => {
    if (isLineMode) {
      inputRef.current?.focus();
    } else {
      focusOuterBorder();
    }
  }, [isLineMode]);

  if (!isLineMode) {
    return null;
  }

  const isOpen = app.connController.connState === ConnState.OPENED;
  const sendTooltip = isOpen
    ? 'Send this line (Enter). The whole line is sent as a single write.'
    : 'Cannot send, the connection is not open.';

  return (
    <div
      data-testid="tx-line-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        marginTop: '4px',
        padding: '2px 6px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '4px',
        fontFamily: 'Consolas, Menlo, monospace',
      }}
      onKeyDown={(e) => {
        // Only swallow the keys this bar acts on. Ordinary typing is already
        // safe to let bubble: App.handleKeyDown routes to the terminal only
        // when `!isTypingInField(event)`, and this is an <input>.
        //
        // FindBar stops propagation for everything, but it can afford to --
        // it is open only while the user is searching. This bar is focused
        // for as long as line mode is on, so a blanket stop would disable
        // F5, F12, Ctrl+F and Ctrl+Shift+C for the whole session.
        const handledKeys = ['Enter', 'ArrowUp', 'ArrowDown', 'Escape'];
        if (!handledKeys.includes(e.key) || e.ctrlKey || e.altKey || e.metaKey) {
          return;
        }
        e.stopPropagation();
        e.preventDefault();
        if (e.key === 'Enter') {
          app.sendPendingLine();
        } else if (e.key === 'ArrowUp') {
          app.txLineController.historyPrev();
        } else if (e.key === 'ArrowDown') {
          app.txLineController.historyNext();
        } else if (e.key === 'Escape') {
          app.txLineController.clear();
        }
      }}
    >
      <span style={{ opacity: 0.6, userSelect: 'none' }}>&gt;</span>
      <InputBase
        inputRef={inputRef}
        id={TX_LINE_BAR_INPUT_ID}
        inputProps={{ 'data-testid': 'tx-line-bar-input', spellCheck: false }}
        value={app.txLineController.pendingLine}
        onChange={(e) => app.txLineController.setPendingLine(e.target.value)}
        placeholder="Type a line, press Enter to send"
        sx={{ flexGrow: 1, fontFamily: 'inherit', fontSize: '0.9rem' }}
      />
      <Tooltip title={sendTooltip}>
        {/* span so the tooltip still shows while the button is disabled */}
        <span>
          <IconButton
            size="small"
            disabled={!isOpen}
            onClick={() => app.sendPendingLine()}
            data-testid="tx-line-bar-send-button"
          >
            <SendIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </div>
  );
});
