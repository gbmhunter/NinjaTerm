import { IconButton, Tooltip } from '@mui/material';
import { observer } from 'mobx-react-lite';
import React, { useRef, ReactElement, useLayoutEffect, useEffect, forwardRef, useMemo } from 'react';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { FixedSizeList } from 'react-window';

import { SingleTerminal } from 'src/model/Terminals/SingleTerminal/SingleTerminal';
import TerminalRow from './TerminalRow';
import styles from './SingleTerminalView.module.css';
import './SingleTerminalView.css';
import { SelectionController } from 'src/model/SelectionController/SelectionController';
import DisplaySettings from 'src/model/Settings/DisplaySettings/DisplaySettings';

interface Props {
  terminal: SingleTerminal;
  displaySettings: DisplaySettings;
  directionLabel: string;
  testId: string;
}

interface RowProps {
  data: TerminalRow[]; // This is the array of indexes into the terminalRows array
  index: number; // This is the index into the data array above
  style: {};
}

export default observer((props: Props) => {
  const { terminal, displaySettings, directionLabel, testId } = props;

  const reactWindowRef = useRef<FixedSizeList>(null);

  const Row = React.memo(observer((rowProps: RowProps) => {
    const { data, index, style } = rowProps;
    const terminalRowToRender = data[index];
    const terminalRowCursorIsOn = terminal.terminalRows[terminal.cursorPosition[0]];

    // Use memoized span generation from TerminalRow.
    // `Row` is a nested function component (declared inside the parent's
    // body) so ESLint's rules-of-hooks heuristic flags this useMemo as
    // a hook-in-callback. It's actually a valid hook call site — `Row` is
    // returned to react-window as the row renderer. Disable just this one.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const spans = useMemo(() => {
      // Determine cursor class
      const cursorClass = terminal.isFocused ? styles.cursorFocused : styles.cursorUnfocused;
      const stylesWithCursor = { ...styles, cursorFocused: cursorClass };
      
      return terminalRowToRender.getSpans(
        terminal.id,
        terminal.cursorPosition,
        terminalRowCursorIsOn,
        stylesWithCursor
      );
    }, [
      terminalRowToRender.terminalCharsHash,
      terminal.cursorPosition[0],
      terminal.cursorPosition[1],
      terminal.isFocused,
      terminalRowCursorIsOn?.uniqueRowId
    ]);

    // Make a ID that is unique in the entire DOM tree. This means that we have to append the terminal
    // ID because there could be multiple terminals on the page (all with their own row-1, row-2, e.t.c)
    const uniqueTerminalRowId = terminal.id + '-row-' + terminalRowToRender.uniqueRowId;

    return (
      <div id={uniqueTerminalRowId} className="terminal-row" style={style}>
        {spans}
      </div>
    );
  }));

  // Run this after every render, even though we only need to do it if
  // a new row has been added. It's too computationally expensive to
  // do a deep compare of the text segments
  // Must be useLayoutEffect(), not useEffect(). If useEffect()
  // is used, user sees jerky motion if scroll lock is applied
  // or they are in the middle of the data and data is being
  // removed from the start (buffer is full).
  // This needs to be done because when we recreate the list it does not
  // remember it's scroll position
  useLayoutEffect(() => {
    if (reactWindowRef.current === null) {
      return;
    }
    if (terminal.scrollLock) {
      reactWindowRef.current.scrollToItem(terminal.filteredTerminalRows.length - 1, 'auto');
    } else
    {
      // Scroll to the position determined by the Terminal model
      reactWindowRef.current.scrollTo(terminal.scrollPos);
    }
  });

  // Capture the selection into the cache on mouseup (after the user finishes dragging).
  // At mouseup time both endpoints are guaranteed to be in the DOM, so getSelectionInfo
  // returns a valid result. We do NOT use selectionchange because Chrome fires it when
  // react-window removes DOM nodes, and the adjusted selection may be wrong.
  // Cache is cleared when the user clicks outside this terminal.
  useEffect(() => {
    let isSelectingInThisTerminal = false;

    const handleMouseDown = (e: MouseEvent) => {
      // Always clear the cache on mousedown. This ensures that while the user is mid-drag,
      // getSelectionInfoIfWithinTerminal() falls back to the live DOM selection (which is
      // correct for on-screen rows). The cache is repopulated at mouseup.
      terminal.lastKnownSelectionInfo = null;
      const terminalEl = document.getElementById(terminal.id);
      if (terminalEl && terminalEl.contains(e.target as Node)) {
        isSelectingInThisTerminal = true;
      } else {
        isSelectingInThisTerminal = false;
      }
    };

    const handleMouseUp = () => {
      if (!isSelectingInThisTerminal) return;
      isSelectingInThisTerminal = false;
      const info = SelectionController.getSelectionInfo(window.getSelection(), terminal.id);
      if (info !== null) {
        terminal.lastKnownSelectionInfo = info;
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [terminal.id]);

  // SELECTION LOGIC
  //=============================================================================

  const selection = window.getSelection();
  // Convert the selection (which has pointers to the nodes) into the rows and columns of the terminal
  // that the selection starts and ends at
  let selectionInfo = SelectionController.getSelectionInfo(selection, terminal.id);

  // Re-applies the mouseup-cached selection (with clamping for off-screen endpoints).
  // Called from both useLayoutEffect (React re-renders) and onItemsRendered (scroll
  // events that bypass React re-renders). Without the onItemsRendered call, Chrome
  // permanently moves the selection anchor when a row is virtualized away during a
  // wheel scroll, because no React re-render occurs to correct it.
  const applyLastKnownSelection = () => {
    const lastKnown = terminal.lastKnownSelectionInfo;
    if (lastKnown === null) return false;

    const firstRowIdNum = parseInt(lastKnown.firstRowId.split('-').slice(-1)[0]);
    const lastRowIdNum = parseInt(lastKnown.lastRowId.split('-').slice(-1)[0]);

    let effectiveFirstRowId = lastKnown.firstRowId;
    let effectiveFirstColIdx = lastKnown.firstColIdx;
    if (!document.getElementById(lastKnown.firstRowId)) {
      const firstVisible = terminal.filteredTerminalRows.find(
        (row) =>
          row.uniqueRowId >= firstRowIdNum &&
          row.uniqueRowId <= lastRowIdNum &&
          document.getElementById(terminal.id + '-row-' + row.uniqueRowId) !== null
      );
      if (!firstVisible) return true; // entire selection off-screen — nothing to highlight
      effectiveFirstRowId = terminal.id + '-row-' + firstVisible.uniqueRowId;
      effectiveFirstColIdx = 0;
    }

    let effectiveLastRowId = lastKnown.lastRowId;
    let effectiveLastColIdx = lastKnown.lastColIdx;
    if (!document.getElementById(lastKnown.lastRowId)) {
      let lastVisible: TerminalRow | null = null;
      for (const row of terminal.filteredTerminalRows) {
        if (
          row.uniqueRowId >= firstRowIdNum &&
          row.uniqueRowId <= lastRowIdNum &&
          document.getElementById(terminal.id + '-row-' + row.uniqueRowId) !== null
        ) {
          lastVisible = row;
        }
      }
      if (!lastVisible) return true; // entire selection off-screen — nothing to highlight
      effectiveLastRowId = terminal.id + '-row-' + lastVisible.uniqueRowId;
      effectiveLastColIdx = lastVisible.terminalChars.length;
    }

    SelectionController.selectTerminalText(
      effectiveFirstRowId, effectiveFirstColIdx,
      effectiveLastRowId, effectiveLastColIdx
    );
    return true;
  };

  // After every render, re-apply the selection highlight so it stays visible even as
  // react-window adds/removes rows. We prefer the mouseup-cached selection over the
  // live DOM selection because after virtualization Chrome adjusts the live selection
  // to another connected node, which would overwrite the correct highlight.
  useLayoutEffect(() => {
    if (applyLastKnownSelection()) return;

    // No cached selection (mousedown cleared it) — fall back to the live DOM selection.
    // This handles the mid-drag case where the user is actively making a selection.
    if (selectionInfo !== null) {
      SelectionController.selectTerminalText(
        selectionInfo.anchorRowId, selectionInfo.anchorColIdx,
        selectionInfo.focusRowId, selectionInfo.focusColIdx);
    }
  });

  //=============================================================================

  const terminalDiv = useRef<HTMLInputElement>(null);

  // This is what I tried to get working to set the
  // react-window height but it didn't work. Leaving it
  // here because this might be worth getting working
  // in the future.
  // useEffect(() => {
  //   if (!terminalDiv?.current?.offsetHeight) {
  //     return;
  //   }
  //   const boundingRect = terminalDiv?.current.getBoundingClientRect();
  //   const { width: width1, height: height1 } = boundingRect;
  //   console.log('setting height=', height1);
  //   setHeight(height1);
  // }, [terminalDiv]);

  useLayoutEffect(() => {
    if (!terminalDiv?.current?.offsetHeight) {
      return () => {};
    }
    const handleResize = () => {
      if (!terminalDiv?.current?.offsetHeight) {
        return;
      }
      terminal.setTerminalViewHeightPx(terminalDiv?.current?.offsetHeight);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // WARNING: Must use memoized component here, if not, it gets recreated on each render of
  // the terminal and the scroll gets messed up. Spent a lot of time working this out :-O
  const outerListElementMemoized = useMemo(() => {
    return forwardRef((props, ref: any) => (
      <div
        ref={ref}
        onWheel={(event) => {
          // Disable scroll lock if the user scrolled upwards
          if (event.deltaY < 0) {
            terminal.setScrollLock(false);
          }
        }}
        {...props} />
    ))
  }, []);


  let scrollLockUnlockIcon;
  if (terminal.scrollLock) {
    scrollLockUnlockIcon = <LockIcon
      sx={{
        width: '40px',
        height: '40px',
      }}
    />
  } else {
    scrollLockUnlockIcon = <LockOpenIcon
      sx={{
        width: '40px',
        height: '40px',
      }}
    />
  }

  return (
    <>
      {/* ======================================================= */}
      {/* OUTER TERMINAL WRAPPER */}
      {/* ======================================================= */}
      {/* This is the outer terminal div which sets the background colour */}
      <div
        id={terminal.id} // Assign terminal ID to outer most DOM element
        tabIndex={terminal.isFocusable ? 0 : undefined}
        className={`${styles.outerTerminalWrapper} ${terminal.isFocusable ? styles.focusable : ''}`}
        data-testid={testId + '-outer'}
        style={{
          flexGrow: 1,
          // marginBottom: '10px',
          padding: '5px', // This is what adds some space between the outside edges of the terminal and the shown text in the react-window
          boxSizing: 'border-box',
          overflowY: 'hidden',
          position: 'relative',
          backgroundColor: displaySettings.defaultBackgroundColor.appliedValue,
          // These are used to set the default text color for the terminal via CSS. ANSI escape codes
          // may override these colors. See SingleTerminalView.css for where these are used.
          '--default-tx-color': terminal.defaultTxColor,
          '--default-rx-color': terminal.defaultRxColor,
        } as React.CSSProperties & { [key: string]: string | number }}
        onFocus={(e) => {
          terminal.setIsFocused(true);
        }}
        onBlur={(e) => {
          terminal.setIsFocused(false);
        }}
        onKeyDown={(e) => {
          // Key presses now dealt with by global handler in App component
          // terminal.handleKeyDown(e);
        }}
      >
        {/* ======================================================= */}
        {/* DIRECTION INDICATOR */}
        {/* ======================================================= */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: '60px',
            padding: '0px 10px',
            backgroundColor: 'rgba(40, 40, 40, 0.5)',
            fontFamily: 'Consolas, Menlo, monospace',
          }}
        >
          {directionLabel}
        </div>
        {/* ======================================================= */}
        {/* CLIPBOARD COPY BUTTON */}
        {/* ======================================================= */}
        <Tooltip
          {...displaySettings.getBasicTooltipConfig()}
          title="Copy all the text in this terminal (including the scrollback buffer) to the clipboard.">
        <IconButton
          onClick={() => {
            terminal.copyAllTextToClipboard();
          }}
          sx={{
            position: 'absolute',
            top: '0px',
            right: '30px', // Adjust this to position next to the directionLabel
            padding: '5px',
            color: 'rgba(255, 255, 255, 0.7)',
            zIndex: 1, // Ensure it's above other elements
          }}
        >
          <ContentCopyIcon
            sx={{
              width: '20px', // Smaller icon
              height: '20px',
            }}
          />
        </IconButton>
        </Tooltip>
        {/* ======================================================= */}
        {/* CONTAINER HOLDING FIXED-SIZE LIST */}
        {/* ======================================================= */}
        <div
          ref={terminalDiv}
          style={{
            height: '100%',
            // This sets the font for displayed data in the terminal
            fontFamily: 'Consolas, Menlo, monospace',

            // This sets the terminal text color
            color: terminal.defaultRxColor,

            // This sets the font size for data displayed in the terminal
            fontSize: terminal.charSizePx + 'px',

            // Line height needs to be set to 1.0 for autoscroll to work well
            lineHeight: 1.0,

            position: 'relative', // This is so we can use position: absolute for the down icon
            // overflowY: hidden is important so that that it ignores the height of the child
            // react-window List when calculating what size it should be. Then the List
            // height is set from the height of this div.
            overflowY: 'hidden',

            boxSizing: 'border-box',
          }}
          data-testid={testId}
          className={styles.terminal}
        >
          <FixedSizeList
            ref={reactWindowRef}
            className={styles.fixedSizeList}
            height={terminal.terminalViewHeightPx}
            // Add a bit of padding to the height
            itemSize={terminal.charSizePx + terminal.verticalRowPaddingPx}
            width="100%"
            itemData={terminal.filteredTerminalRows}
            itemCount={terminal.filteredTerminalRows.length}
            onScroll={(scrollProps) => {
              terminal.fixedSizedListOnScroll(scrollProps);
            }}
            onItemsRendered={() => {
              // Wheel scrolling does not trigger a React re-render of this component,
              // so useLayoutEffect never runs. We re-apply the cached selection here
              // every time react-window renders a new set of rows (including on scroll)
              // so the browser selection is always corrected after virtualization.
              applyLastKnownSelection();
            }}
            overscanCount={5}
            outerElementType={outerListElementMemoized}
          >
            {Row}
          </FixedSizeList>
          {/* ================== SCROLL LOCK/UNLOCK BUTTON ==================== */}
          <IconButton
            onClick={() => {
              if (terminal.scrollLock) {
                terminal.setScrollLock(false);
              } else {
                terminal.setScrollLock(true);
              }
            }}
            sx={{
              // display: terminal.scrollLock ? 'none' : 'block',
              position: 'absolute', // Fix it to the bottom right of the TX/RX view port
              bottom: '10px',
              right: '30px',
              color: 'rgba(255, 255, 255, 0.4)',
            }}
          >
            {scrollLockUnlockIcon}
          </IconButton>
        </div>
      </div>
    </>
  );
});
