import { observer } from "mobx-react-lite";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";

import { App } from "src/model/App";
import MacroView from "./MacroRowView";
import MacroSettingsModalView from "./MacroSettingsModalView";

interface Props {
  app: App;
}

export default observer((props: Props) => {
  const { app } = props;

  // Create macro rows
  const macroRows = app.terminals.rightDrawer.macroController.macrosArray.map((macro, index) => {
    return <MacroView key={index} app={app} macroController={app.terminals.rightDrawer.macroController} macro={macro} />;
  });

  return (
    <ResizableBox
      className="box"
      width={200}
      resizeHandles={["w"]}
      axis="x"
      style={{ padding: "0px 0px 0px 10px", margin: "0px 0px 10px 0px", fontSize: "12px" }}
      handle={
        <div
          style={{
            height: "100%",
            width: "10px", // This determines how easy it is to click on the resizable element
            // backgroundColor: "#DC3545",
            position: "absolute",
            left: 0,
            top: 0,
            cursor: "ew-resize",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderLeft: "1px solid #505050", // Same border color as used on the left-hand nav menu
          }}
        ></div>
      }
    >
      <div className="resizable-child-container"> {/* ResizableBox requires a single child component */}
      <div>Macros</div>
      <div className="macro-rows-container" style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
        {macroRows}
      </div>
      <MacroSettingsModalView app={app} macroController={app.terminals.rightDrawer.macroController} />
      </div>
    </ResizableBox>
  );
});
