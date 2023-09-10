import { IconButton } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { WheelEvent, useRef, useEffect, ReactElement, useState } from 'react';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
// import { AutoSizer } from 'react-virtualized';

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

  const txRxRef = useRef<HTMLInputElement>(null);

  const Row = observer((rowProps: RowProps) => {
    const { data, index, style } = rowProps;
    console.log('Row() called.');
    const terminalRow = data[index];
    const spans: ReactElement[] = [];
    for (
      let colIdx = 0;
      colIdx < terminalRow.terminalChars.length;
      colIdx += 1
    ) {
      console.log('rendering', terminalRow.terminalChars[colIdx].char);
      let id = '';
      if (
        index === terminal.cursorPosition[0] &&
        colIdx === terminal.cursorPosition[1]
      ) {
        id = 'cursor';
      }
      spans.push(<span id={id}>{terminalRow.terminalChars[colIdx].char}</span>);
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
    if (txRxRef.current && terminal.scrollLock) {
      txRxRef.current.scrollTop = txRxRef.current.scrollHeight;
    }
  });

  const elRef = useRef();
  const [height, setHeight] = useState(0);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!elRef?.current?.clientHeight) {
      return;
    }
    setHeight(elRef?.current?.clientHeight);
  }, [elRef?.current?.clientHeight]);

  useEffect(() => {
    if (!elRef?.current?.clientWidth) {
      return;
    }
    setWidth(elRef?.current?.clientWidth);
  }, [elRef?.current?.clientWidth]);

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
      ref={elRef}
      style={{
        flexGrow: '1',
        backgroundColor: '#161616',
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap', // This allows \n to create new lines
        overflowY: 'scroll',
        // padding: '10px',
        marginBottom: '10px',
        position: 'relative', // This is so we can use position: absolute for the down icon
      }}
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
            height={height}
            itemCount={appStore.txRxTerminal.terminalRows.length}
            itemSize={20}
            width={width}
            itemData={appStore.txRxTerminal.terminalRows}
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
