import { IconButton } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { useRef, ReactElement, useLayoutEffect, forwardRef, useEffect, useCallback, useMemo } from 'react';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { FixedSizeList } from 'react-window';

import Terminal from './SingleTerminal';
import TerminalRow from './SingleTerminalRow';
import styles from './SingleTerminalView.module.css';
import './SingleTerminalView.css';

function getChildNodeIndex(child: Element | null)
{
    var i = 0;
    while ((child = child!.previousElementSibling) != null )
    i++;

    return i;
}

interface Props {
  terminal: Terminal;
  directionLabel: string;
  testId: string;
}

interface RowProps {
  data: TerminalRow[]; // This is the array of indexes into the terminalRows array
  index: number; // This is the index into the data array above
  style: {};
}

class SelectionInfo {
  anchorRowId: string;
  anchorSpanIndexInRow: number;
  anchorOffset: number;
  focusRowId: string;
  focusSpanIndexInRow: number;
  focusOffset: number;
  constructor(anchorRowId: string, anchorSpanIndexInRow: number, anchorOffset: number, focusRowId: string, focusSpanIndexInRow: number, focusOffset: number) {
    this.anchorRowId = anchorRowId;
    this.anchorSpanIndexInRow = anchorSpanIndexInRow;
    this.anchorOffset = anchorOffset;
    this.focusRowId = focusRowId;
    this.focusSpanIndexInRow = focusSpanIndexInRow;
    this.focusOffset = focusOffset;
  }

  static createFromSelection(sel: Selection | null): SelectionInfo | null {
    if (sel === null) {
      return null;
    }

    const anchorNode = sel.anchorNode;
    if (anchorNode === null) {
      return null;
    }
    const anchorOffset = sel.anchorOffset;

    const focusNode = sel.focusNode;
    if (focusNode === null) {
      return null;
    }
    const focusOffset = sel.focusOffset;
    // Get row IDs of the start and end of the selection

    const anchorSpan = anchorNode.parentElement;
    const anchorSpanIndexInRow = getChildNodeIndex(anchorSpan);
    const anchorRowDiv = anchorSpan!.parentElement;
    const anchorRowId = anchorRowDiv!.id;

    const focusSpan = focusNode!.parentElement;
    const focusSpanIndexInRow = getChildNodeIndex(focusSpan);
    const focusRowDiv = focusSpan!.parentElement;
    const focusRowId = focusRowDiv!.id;

    return new SelectionInfo(anchorRowId, anchorSpanIndexInRow, anchorOffset, focusRowId, focusSpanIndexInRow, focusOffset);
  }

}

// const outerListElement = forwardRef((props, ref: any) => (
//   <div
//     className="outerListElement"
//     ref={ref}
//     onWheel={(event) => {
//       console.log('onWheel! event: ', event);
//       if (event.deltaY < 0) {
//         globalTerminal?.setScrollLock(false);
//       }
//     }}
//     {...props} />
// ))

// let globalTerminal: Terminal | null = null;

export default observer((props: Props) => {
  const { terminal, directionLabel, testId } = props;
  // globalTerminal = terminal;

  const reactWindowRef = useRef<FixedSizeList>(null);

  const Row = observer((rowProps: RowProps) => {
    const { data, index, style } = rowProps;
    const terminalRowToRender = data[index];
    // const terminalRow = terminal.terminalRows[terminalRowIdx];
    const terminalRowCursorIsOn = terminal.terminalRows[terminal.cursorPosition[0]];

    // Only create spans if we need to change style, because creating
    // a span per char is very performance intensive
    const spans: ReactElement[] = [];
    let text = '';
    let prevClassName = '';

    for (let colIdx = 0; colIdx < terminalRowToRender.terminalChars.length; colIdx += 1) {
      const terminalChar = terminalRowToRender.terminalChars[colIdx];
      let thisCharsClassName = terminalChar.className;
      // Check if this is the row and column position that the cursor
      // is sitting on. For the row, we do an object comparison between
      // the terminalRows and filteredTerminalRows array to make sure
      // they are the same
      if (terminalRowToRender === terminalRowCursorIsOn && colIdx === terminal.cursorPosition[1]) {
        // Found the cursor position!
        if (terminal.isFocused) {
          thisCharsClassName += ' ' + styles.cursorFocused;
        } else {
          thisCharsClassName += ' ' + styles.cursorUnfocused;
        }
      }

      if (colIdx === 0) {
        // First char in row, so set the prev class name
        // equal to this one so we don't create a new span
        // below
        prevClassName = thisCharsClassName;
      }

      if (thisCharsClassName !== prevClassName) {
        // Class name has changed. Dump all existing text into a span
        // and reset the text buffer
        spans.push(
          <span key={spans.length} className={prevClassName}>
            {text}
          </span>
        );
        text = '';
        prevClassName = thisCharsClassName;
      }

      text += terminalChar.char;
    }

    // Add the last span. This will always at least contain
    // the last char in the row, maybe more previous ones if the
    // class name hasn't changed
    spans.push(
      <span key={spans.length} className={prevClassName}>
        {text}
      </span>
    );
    return (
      <div id={'row-' + index} className="terminal-row" style={style}>
        {spans}
      </div>
    );
  });

  const selObj = window.getSelection();
  console.log('Selection before render: ', selObj);
  let selectionInfo = SelectionInfo.createFromSelection(selObj);
  // if (selObj !== null) {
  //   const anchorNode = selObj.anchorNode;
  //   const anchorOffset = selObj.anchorOffset;
  //   const focusNode = selObj.focusNode;
  //   const focusOffset = selObj.focusOffset;
  //   // Get row IDs of the start and end of the selection

  //   const anchorSpan = anchorNode!.parentElement;
  //   const anchorSpanIndexInRow = getChildNodeIndex(anchorSpan);
  //   const anchorRowDiv = anchorSpan!.parentElement;
  //   const anchorRowId = anchorRowDiv!.id;

  //   const focusSpan = focusNode!.parentElement;
  //   const focusSpanIndexInRow = getChildNodeIndex(focusSpan);
  //   const focusRowDiv = focusSpan!.parentElement;
  //   const focusRowId = focusRowDiv!.id;

  //   console.log('anchorRowId: ', anchorRowId, 'anchorSpanIdx: ', anchorSpanIndexInRow, 'anchorOffset: ', anchorOffset, 'focusRowId: ', focusRowId, 'focusSpanIdx', focusSpanIndexInRow, 'focusOffset: ', focusOffset);

  //   selectionInfo = new SelectionInfo(anchorRowId, anchorSpanIndexInRow, anchorOffset, focusRowId, focusSpanIndexInRow, focusOffset);
  // }

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

    const afterRenderSel = window.getSelection();
    if (selObj === null || afterRenderSel === null) {
      return;
    }

    if (selectionInfo === null) {
      return;
    }

    // Look for the same div IDs as before the render
    const anchorRowDiv = document.getElementById(selectionInfo.anchorRowId);
    if (anchorRowDiv === null) {
      console.log('Did not find anchorRowDiv');
      return;
    }
    const anchorSpan = anchorRowDiv.children[selectionInfo.anchorSpanIndexInRow];
    const anchorTextNode = anchorSpan.childNodes[0];

    const focusRowDiv = document.getElementById(selectionInfo.focusRowId);
    if (focusRowDiv === null) {
      console.log('Did not find focusRowDiv');
      return;
    }
    const focusSpan = focusRowDiv.children[selectionInfo.focusSpanIndexInRow];
    const focusTextNode = focusSpan.childNodes[0];
    console.log('Setting selection anchorNode: ', anchorTextNode, ' anchorOffset: ', selectionInfo.anchorOffset, ' focusNode: ', focusTextNode, ' focusOffset: ', selectionInfo.focusOffset);
    afterRenderSel.setBaseAndExtent(anchorTextNode, selectionInfo.anchorOffset, focusTextNode, selectionInfo.focusOffset);
  });

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
  // the terminal and the scroll gets messed up. Spent a lot of time working this out :-
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
        tabIndex={terminal.isFocusable ? 0 : undefined}
        className={`${styles.outerTerminalWrapper} ${terminal.isFocusable ? styles.focusable : ''}`}
        data-testid={testId + '-outer'}
        style={{
          flexGrow: 1,
          marginBottom: '10px',
          padding: '15px', // This is what adds some space between the outside edges of the terminal and the shown text in the react-window
          boxSizing: 'border-box',
          overflowY: 'hidden',
          backgroundColor: '#000000',
          position: 'relative',
        }}
        onFocus={(e) => {
          terminal.setIsFocused(true);
        }}
        onBlur={(e) => {
          terminal.setIsFocused(false);
        }}
        onKeyDown={(e) => {
          terminal.handleKeyDown(e);
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
        {/* CONTAINER HOLDING FIXED-SIZE LIST */}
        {/* ======================================================= */}
        <div
          ref={terminalDiv}
          style={{
            height: '100%',
            // This sets the font for displayed data in the terminal
            fontFamily: 'Consolas, Menlo, monospace',

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
