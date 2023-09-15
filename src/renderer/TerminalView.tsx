import { IconButton } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { WheelEvent, useRef, useEffect, ReactElement, useState } from 'react';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { FixedSizeList } from 'react-window';
import { toJS } from 'mobx';

import { App } from 'model/App';
import Terminal from 'model/Terminal/Terminal';
import TerminalRow from 'model/Terminal/TerminalRow';

interface Props {
  appStore: App;
  terminal: Terminal;
}

interface RowProps {
  data: TerminalRow[];
  index: number;
  style: {};
}

export default observer((props: Props) => {
  const { appStore, terminal } = props;

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
        className = 'cursor';
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
    // console.log(txRxRef);
    // if (txRxRef.current !== null) {
    //   txRxRef.current._onResize();
    // }
    return <div style={style}>{spans}</div>;
  });

  // Run this after every render, as it's too computationally expensive to
  // do a deep compare of the text segments
  useEffect(() => {
    // Only scroll to bottom if enabled in app model
    if (reactWindowRef.current && terminal.scrollLock) {
      reactWindowRef.current.scrollToItem(
        appStore.txRxTerminal.terminalRows.length - 1
      );
    }
  });

  const inputOutputTextDiv = useRef<HTMLInputElement>(null);
  const [height, setHeight] = useState(0);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!inputOutputTextDiv?.current?.clientHeight) {
      return;
    }
    setHeight(inputOutputTextDiv?.current?.clientHeight);
  }, [inputOutputTextDiv?.current?.clientHeight]);

  useEffect(() => {
    if (!inputOutputTextDiv?.current?.clientWidth) {
      return;
    }
    setWidth(inputOutputTextDiv?.current?.clientWidth);
  }, [inputOutputTextDiv?.current?.clientWidth]);

  // Use a fake height if testing
  let heightDebug;
  if (appStore.testing) {
    heightDebug = 200;
  } else {
    heightDebug = height;
  }

  return (
    <div
      id="input-output-text"
      onWheel={(e: WheelEvent<HTMLDivElement>) => {
        // Disable scroll lock if enabled and the scroll direction was
        // up (negative deltaY)
        if (e.deltaY < 0 && terminal.scrollLock) {
          terminal.setScrollLock(false);
        }
      }}
      ref={inputOutputTextDiv}
      style={{
        flexGrow: '1',
        backgroundColor: '#161616',
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap', // This allows \n to create new lines
        // overflowY: 'scroll',
        // padding: '10px',
        marginBottom: '10px',
        position: 'relative', // This is so we can use position: absolute for the down icon
      }}
      data-testid="tx-rx-terminal-view"
    >
      {/* <div
        ref={txRxRef}
        style={{
          height: '100%',
          width: '100%',
          // position: 'absolute',
          // overflowY: 'scroll',
          padding: '10px',
        }}
      > */}
      {/* <div
          id="limiting-text-width"
          style={{ wordBreak: dataPaneWordBreak, width: dataPaneWidth }}
          data-testid="tx-rx-terminal-view"
        >
          {terminal.outputHtml}
        </div> */}
      {/* <AutoSizer> */}
      {/* {({ height, width }) => ( */}
      <FixedSizeList
        ref={reactWindowRef}
        height={heightDebug}
        itemCount={appStore.txRxTerminal.terminalRows.length}
        itemSize={20}
        width={width}
        itemData={appStore.txRxTerminal.terminalRows}
        onScroll={(scrollProps) => {
          const { scrollOffset } = scrollProps;
          console.log('scrollOffset=', scrollOffset);
        }}
      >
        {Row}
      </FixedSizeList>
      {/* )} */}
      {/* </AutoSizer> */}
      {/* </div> */}
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
  );
});
