import { IconButton } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { useRef, ReactElement, useLayoutEffect, forwardRef, useEffect, useCallback, useMemo } from 'react';

import NativeTerminal from './NativeTerminal';

interface Props {
  nativeTerminal: NativeTerminal;
  directionLabel: string;
  testId: string;
}

export default observer((props: Props) => {
  const { nativeTerminal, directionLabel, testId } = props;

  const myRef = useRef(null);
  useEffect(()=>{
    console.log('myRef.current=', myRef.current);
    nativeTerminal.giveDivRef(myRef.current);
  },[])

  return (
    <>

      <div ref={myRef}>
        Native terminal!
      </div>
    </>
  );
});
