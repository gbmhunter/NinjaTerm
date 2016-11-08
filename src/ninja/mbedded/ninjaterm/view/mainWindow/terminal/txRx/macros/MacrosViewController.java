package ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx.macros;

import javafx.fxml.FXML;
import javafx.geometry.Pos;
import javafx.geometry.VPos;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.RowConstraints;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.model.terminal.txRx.macros.Macro;
import ninja.mbedded.ninjaterm.util.javafx.GridPaneHelper;
import org.controlsfx.glyphfont.GlyphFont;

/**
 * View controller for the "display" settings pop-up window.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-11-05
 * @last-modified 2016-11-08
 */
public class MacrosViewController {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    private GridPane macroGridPane;


    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//


    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public MacrosViewController() {
    }

    public void init(Model model, Terminal terminal, GlyphFont glyphFont) {

        // Create a macro view for every macro in the model
        for(Macro macro : terminal.txRx.macroManager.macros) {

            MacroRow macroRow = new MacroRow(model, macro, glyphFont);
            macroGridPane.addRow(GridPaneHelper.getNumRows(macroGridPane), macroRow.nameTextField, macroRow.sequenceTextField, macroRow.sendButton);

            // Make sure added row
//            RowConstraints rowConstraints = new RowConstraints();
//            rowConstraints.setValignment(VPos.CENTER);
//            macroGridPane.getRowConstraints().add(rowConstraints);

        }

    }
}
