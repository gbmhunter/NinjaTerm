import { Button, Popover } from "@mui/material";
import { Sketch } from "@uiw/react-color";
import React, { useState, useEffect } from "react";

interface Props {
  show: boolean;
  setShow: (show: boolean) => void;
  anchorEl: HTMLElement | null;
  setAnchorEl: (anchorEl: HTMLElement | null) => void;
  initialColor: string;
  onApply: (color: string) => void;
  onCancel: () => void;
}

export default function PopoverColorPicker(props: Props) {
  const { show, setShow, anchorEl, setAnchorEl, initialColor, onApply, onCancel } = props;

  const [currentColor, setCurrentColor] = useState(initialColor);

  useEffect(() => {
    if (show) {
      setCurrentColor(initialColor);
    }
  }, [initialColor, show]);

  const handleCloseAndApply = () => {
    onApply(currentColor);
    setShow(false);
    setAnchorEl(null);
  };

  const handleCloseAndCancel = () => {
    onCancel();
    setShow(false);
    setAnchorEl(null);
  };

  return (
    <Popover
      open={show}
      anchorEl={anchorEl}
      onClose={handleCloseAndApply}
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
          color={currentColor}
          onChange={(colorResult) => {
            setCurrentColor(colorResult.hex);
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button
            size="small"
            onClick={handleCloseAndCancel}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleCloseAndApply}
          >
            Apply
          </Button>
        </div>
      </div>
    </Popover>
  );
}
