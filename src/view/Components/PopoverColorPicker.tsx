import { Button } from "@mui/material";
import { Popover } from "@mui/material";
import { Sketch } from "@uiw/react-color";

interface Props {
  show: boolean;
  setShow: (show: boolean) => void;
  anchorEl: HTMLElement | null;
  setAnchorEl: (anchorEl: HTMLElement | null) => void;
  color: string;
  setColor: (color: string) => void;
}

export default function PopoverColorPicker(props: Props) {
  const { show, setShow, anchorEl, setAnchorEl, color, setColor } = props;

  return (
    <Popover
      open={show}
      anchorEl={anchorEl}
        onClose={() => {
          setShow(false);
          setAnchorEl(null);
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Sketch
            color={color}
            onChange={(color) => {
              setColor(color.hex);
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button
              size="small"
              onClick={() => {
                setShow(false);
                setAnchorEl(null);
              }}
            >
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => {
                setShow(false);
                setAnchorEl(null);
              }}
            >
              Apply
            </Button>
          </div>
      </div>
    </Popover>
  );
}
