import { IconButton, InputBase, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';

import { SingleTerminal } from 'src/model/Terminals/SingleTerminal/SingleTerminal';

interface Props {
  terminal: SingleTerminal;
}

/**
 * Floating Find bar that lives in the top-right of a terminal pane. Shown
 * only when `terminal.isFindOpen` is true (toggled by Ctrl+F).
 *
 * Keyboard:
 *   Esc            — close the bar (also clears the query)
 *   Enter          — jump to next match
 *   Shift+Enter    — jump to previous match
 */
export default observer((props: Props) => {
  const { terminal } = props;

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus + select the query when the bar opens, so re-opening Find while
  // an old query is still present lets the user immediately retype.
  useEffect(() => {
    if (terminal.isFindOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [terminal.isFindOpen]);

  /**
   * Closes Find and parks focus on `#outer-border` so the next keystroke
   * still bubbles into `App.handleKeyDown`. Otherwise the input unmounts,
   * focus falls back to `document.body` (outside `#outer-border`), and the
   * next Ctrl+F is swallowed until the user clicks somewhere inside the app.
   */
  const closeAndRestoreFocus = () => {
    const outerBorder = document.getElementById('outer-border') as HTMLElement | null;
    outerBorder?.focus();
    terminal.closeFind();
  };

  if (!terminal.isFindOpen) {
    return null;
  }

  const matches = terminal.findMatches;
  const total = matches.length;
  const currentNumber = total === 0 ? 0 : terminal.currentMatchIndex + 1;
  const hasQuery = terminal.findQuery.length > 0;
  const noMatchesForQuery = hasQuery && total === 0;

  return (
    <div
      data-testid={`${terminal.id}-find-bar`}
      style={{
        position: 'absolute',
        top: '6px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 6px',
        backgroundColor: 'rgba(40, 40, 40, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '4px',
        fontFamily: 'Consolas, Menlo, monospace',
        // Keep the bar narrow enough that it doesn't cover the copy/scroll
        // buttons on the right of the pane.
        maxWidth: 'min(420px, 80%)',
      }}
      onKeyDown={(e) => {
        // Stop the global key handler (App.handleKeyDown) from interpreting
        // these as terminal keystrokes / shortcuts while the user is typing
        // in the Find query.
        e.stopPropagation();
        if (e.key === 'Escape') {
          closeAndRestoreFocus();
        } else if (e.key === 'Enter') {
          if (e.shiftKey) {
            terminal.prevMatch();
          } else {
            terminal.nextMatch();
          }
        }
      }}
    >
      <InputBase
        inputRef={inputRef}
        value={terminal.findQuery}
        onChange={(e) => terminal.setFindQuery(e.target.value)}
        placeholder="Find"
        inputProps={{
          'data-testid': `${terminal.id}-find-input`,
          'aria-label': 'Find in terminal',
          style: {
            padding: '2px 6px',
            color: 'white',
            fontSize: '13px',
          },
        }}
        sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.35)',
          borderRadius: '3px',
          width: '180px',
          border: noMatchesForQuery ? '1px solid #e57373' : '1px solid transparent',
        }}
      />

      <span
        data-testid={`${terminal.id}-find-count`}
        style={{
          color: noMatchesForQuery ? '#e57373' : 'rgba(255, 255, 255, 0.75)',
          fontSize: '12px',
          minWidth: '52px',
          textAlign: 'center',
        }}
      >
        {hasQuery ? `${currentNumber} / ${total}` : ''}
      </span>

      <Tooltip title="Match case" disableInteractive>
        <IconButton
          size="small"
          onClick={() => terminal.setFindCaseSensitive(!terminal.findCaseSensitive)}
          sx={{
            color: terminal.findCaseSensitive ? '#ffb74d' : 'rgba(255, 255, 255, 0.6)',
            padding: '2px 6px',
            fontSize: '13px',
            fontWeight: 600,
            lineHeight: 1,
            borderRadius: '3px',
            // Outline the toggle when active so it reads as "on" even at a glance.
            border: terminal.findCaseSensitive ? '1px solid #ffb74d' : '1px solid transparent',
          }}
          data-testid={`${terminal.id}-find-case-toggle`}
        >
          Aa
        </IconButton>
      </Tooltip>

      <Tooltip title="Previous match (Shift+Enter)" disableInteractive>
        <span>
          <IconButton
            size="small"
            onClick={() => terminal.prevMatch()}
            disabled={total === 0}
            sx={{ color: 'rgba(255, 255, 255, 0.75)', padding: '2px' }}
            data-testid={`${terminal.id}-find-prev`}
          >
            <ExpandLessIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Next match (Enter)" disableInteractive>
        <span>
          <IconButton
            size="small"
            onClick={() => terminal.nextMatch()}
            disabled={total === 0}
            sx={{ color: 'rgba(255, 255, 255, 0.75)', padding: '2px' }}
            data-testid={`${terminal.id}-find-next`}
          >
            <ExpandMoreIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Close (Esc)" disableInteractive>
        <IconButton
          size="small"
          onClick={() => closeAndRestoreFocus()}
          sx={{ color: 'rgba(255, 255, 255, 0.75)', padding: '2px' }}
          data-testid={`${terminal.id}-find-close`}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </div>
  );
});
