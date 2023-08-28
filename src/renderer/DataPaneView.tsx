import { IconButton } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { CSSProperties, WheelEvent, useRef, useEffect } from 'react';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import { AppStore } from 'stores/App';
import TextSegment from 'stores/TextSegment';
import DataPane from 'stores/DataPane';

interface Props {
  appStore: AppStore;
  dataPane: DataPane;
  textSegments: TextSegment[];
}

export default observer((props: Props) => {
  const { appStore, dataPane, textSegments } = props;
  console.log('DataPaneView rendering. textSegments=', textSegments);

  // Need to apply white-space: pre-wrap and word-break: break-all to the element holding serial port data, as we want:
  // 1) White space preserved
  // 2) \n to create a new line
  // 3) Text to wrap once it hits the maximum terminal width
  // Always apply +0.1 to the 'ch' units for terminal width, this prevents rounding errors from chopping
  const rxSpans = textSegments.map((segment) => {
    return (
      <span key={segment.key} style={{ color: segment.color }}>
        {segment.text}
      </span>
    );
  });

  // If the width in chars is set to anything but 0, set the width in "ch" units and make
  // sure text will break on anything. Otherwise if width is set to 0, make pane 100% wide and don't
  // break
  let dataPaneWidth = '';
  let dataPaneWordBreak: CSSProperties['wordBreak'];
  if (
    appStore.settings.dataProcessing.appliedData.fields.wrappingWidthChars
      .value > 0
  ) {
    dataPaneWidth = `${appStore.settings.dataProcessing.appliedData.fields.wrappingWidthChars.value}ch`;
    dataPaneWordBreak = 'break-all';
  } else {
    dataPaneWidth = '100%';
    dataPaneWordBreak = 'normal';
  }

  const txRxRef = useRef<HTMLInputElement>(null);

  // Run this after every render, as it's too computationally expensive to
  // do a deep compare of the text segments
  useEffect(() => {
    // Only scroll to bottom if enabled in app model
    if (txRxRef.current && dataPane.scrollLock) {
      txRxRef.current.scrollTop = txRxRef.current.scrollHeight;
    }
  });

  return (
    <div
      id="input-output-text"
      onWheel={(e: WheelEvent<HTMLDivElement>) => {
        // Disable scroll lock if enabled and the scroll direction was
        // up (negative deltaY)
        if (e.deltaY < 0 && dataPane.scrollLock) {
          dataPane.setScrollLock(false);
        }
      }}
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
    >
      <div
        ref={txRxRef}
        style={{
          height: '100%',
          width: '100%',
          position: 'absolute',
          overflowY: 'scroll',
          padding: '10px',
        }}
      >
        <div
          id="limiting-text-width"
          style={{ wordBreak: dataPaneWordBreak, width: dataPaneWidth }}
        >
          {rxSpans}
          {/* Blinking cursor at end of data */}
          <span id="cursor">█</span>
        </div>
      </div>
      {/* ================== SCROLL LOCK ARROW ==================== */}
      <IconButton
        onClick={() => {
          dataPane.setScrollLock(true);
        }}
        sx={{
          display: dataPane.scrollLock ? 'none' : 'block',
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
