import { IconButton } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { WheelEvent, useRef, useEffect, ReactElement, useState, useLayoutEffect } from 'react';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { FixedSizeList } from 'react-window';
import { toJS } from 'mobx';

import { App } from '../../model/App';
import Terminal from '../../model/Terminal/Terminal';
import TerminalRow from '../../model/Terminal/TerminalRow';
import styles from './SingleTerminalView.module.css';

interface Props {
  appStore: App;
  terminal: Terminal;
  testId: string;
}

interface RowProps {
  data: TerminalRow[];
  index: number;
  style: {};
}

export default observer((props: Props) => {
  const { appStore, terminal, testId } = props;

  const reactWindowRef = useRef<FixedSizeList>(null);

  const Row = observer((rowProps: RowProps) => {
    const { data, index, style } = rowProps;
    const terminalRow = data[index];
    const spans: ReactElement[] = [];

    for (
      let colIdx = 0;
      colIdx < terminalRow.terminalChars.length;
      colIdx += 1
    ) {
      const terminalChar = terminalRow.terminalChars[colIdx];
      let className = '';
      if (
        index === terminal.cursorPosition[0] &&
        colIdx === terminal.cursorPosition[1]
      ) {
        // Found the cursor position!
        if (terminal.isFocused) {
          className = styles.cursorFocused;
        } else {
          className = styles.cursorUnfocused;
        }
      }
      spans.push(
        <span
          key={colIdx}
          className={className}
          style={toJS(terminalChar.style)}
        >
          {terminalChar.char}
        </span>
      );
    }
    return <div style={style}>{spans}</div>;
  });

  // Run this after every render, even though we only need to do it if
  // a new row has been added. It's too computationally expensive to
  // do a deep compare of the text segments
  useEffect(() => {
    if (reactWindowRef.current === null) {
      return;
    }
    if (terminal.scrollLock) {
      reactWindowRef.current.scrollToItem(terminal.terminalRows.length - 1);
    } else {
      // Scroll to the position determined by the Terminal model
      reactWindowRef.current.scrollTo(terminal.scrollPos);
    }
  });

  const terminalDiv = useRef<HTMLInputElement>(null);
  const [height, setHeight] = useState(0);

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
      setHeight(terminalDiv?.current?.offsetHeight);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Use a fake height if testing
  let heightDebug;
  if (appStore.testing) {
    heightDebug = 200;
  } else {
    heightDebug = height;
  }



  return (
    // This is the outer terminal div which sets the background colour
    <div
      tabIndex={terminal.isFocusable ? 0 : undefined}
      className={`${styles.outerTerminalWrapper} ${terminal.isFocusable ? styles.focusable : ''}`}
      style={{
        'flexGrow': 1,
        marginBottom: '10px',
        padding: '15px', // This is what adds some space between the outside edges of the terminal and the shown text in the react-window
        boxSizing: 'border-box',
        overflowY: 'hidden',
        backgroundColor: '#000000',
      }}
      onFocus={(e) => {
        terminal.setIsFocused(true);
      }}
      onBlur={(e) => {
        terminal.setIsFocused(false);
      }}
      onKeyDown={(e) => {
        appStore.handleKeyDown(e);
      }}
    >
      <div
        onWheel={(e: WheelEvent<HTMLDivElement>) => {
          // Disable scroll lock if enabled and the scroll direction was
          // up (negative deltaY)
          if (e.deltaY < 0 && terminal.scrollLock) {
            terminal.setScrollLock(false);
          }
        }}
        ref={terminalDiv}
        style={{
          // flexGrow: '1',
          height: '100%',
          // This sets the font for displayed data in the terminal
          fontFamily: 'Consolas, Menlo, monospace',
          // whiteSpace: 'pre-wrap', // This allows \n to create new lines
          // padding: '10px',
          // marginBottom: '10px',
          position: 'relative', // This is so we can use position: absolute for the down icon
          // flexBasis: '0',
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
          height={heightDebug}
          itemCount={terminal.terminalRows.length}
          itemSize={20}
          width="100%"
          itemData={terminal.terminalRows}
          onScroll={(scrollProps) => {
            const { scrollOffset } = scrollProps;
            terminal.setScrollPos(scrollOffset);
          }}
          // Disabled this style, was causing weird layout issues.
          // Not sure why I added it in the first place?
          // style={{ padding: '20px' }}
        >
          {Row}
        </FixedSizeList>
        {/* ================== SCROLL LOCK ARROW ==================== */}
        <IconButton
          onClick={() => {
            terminal.setScrollLock(true);
          }}
          sx={{
            display: terminal.scrollLock ? 'none' : 'block',
            position: 'absolute', // Fix it to the bottom right of the TX/RX view port
            bottom: '20px',
            right: '30px',
            color: 'rgba(255, 255, 255, 0.4)',
          }}
        >
          <ArrowDownwardIcon
            sx={{
              width: '40px',
              height: '40px',
            }}
          />
        </IconButton>
      </div>
    </div>
  );
});
