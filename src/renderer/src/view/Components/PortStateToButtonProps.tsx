import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import { ConnState } from 'src/model/Settings/PortSettings/PortSettings';

type PortStateToButtonPropsItem = {
  text: string;
  color: string;
  icon: any;
};

export const portStateToButtonProps: { [key in ConnState]: PortStateToButtonPropsItem; } = {
  [ConnState.CLOSED]: {
    text: 'Open',
    color: 'success',
    icon: <PlayArrowIcon />,
  },
  [ConnState.CLOSED_BUT_WILL_REOPEN]: {
    text: 'Stop Waiting',
    color: 'warning',
    icon: <StopIcon />,
  },
  [ConnState.OPENED]: {
    text: 'Close',
    color: 'error',
    icon: <StopIcon />,
  },
};
