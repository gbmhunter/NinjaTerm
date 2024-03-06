import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import { PortState } from 'src/model/Settings/PortConfigurationSettings/PortConfigurationSettings';

type PortStateToButtonPropsItem = {
  text: string;
  color: string;
  icon: any;
};

export const portStateToButtonProps: { [key in PortState]: PortStateToButtonPropsItem; } = {
  [PortState.CLOSED]: {
    text: 'Open',
    color: 'success',
    icon: <PlayArrowIcon />,
  },
  [PortState.CLOSED_BUT_WILL_REOPEN]: {
    text: 'Stop Waiting',
    color: 'warning',
    icon: <StopIcon />,
  },
  [PortState.OPENED]: {
    text: 'Close',
    color: 'error',
    icon: <StopIcon />,
  },
};
