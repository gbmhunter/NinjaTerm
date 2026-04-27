import React from "react";
import { TextField, TextFieldProps } from "@mui/material";
import { observer } from "mobx-react-lite";

import ApplyableField from "./ApplyableTextField";

interface ModelProps {
  applyableTextField: ApplyableField;
}

export default observer(
  React.forwardRef(function ApplyableTextFieldView(
    props: TextFieldProps & ModelProps,
    ref: any
  ) {
    const { applyableTextField, ...other } = props;
    return (
      <TextField
        ref={ref}
        {...other}
        value={applyableTextField.dispValue}
        error={!applyableTextField.isValid}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          applyableTextField.setDispValue(event.target.value);
        }}
        onBlur={() => {
          applyableTextField.apply();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            applyableTextField.apply();
          }
        }}
        helperText={applyableTextField.errorMsg}
        inputProps={props.inputProps}
      />
    );
  })
);

// WrappedIcon.muiName = Icon.muiName;
// ui.muiName = TextField.muiName;
// export default ui;
