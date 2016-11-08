package ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx.macros.macroSettingsWindow;

import javafx.fxml.FXML;
import javafx.scene.control.Button;
import javafx.scene.control.TextField;
import javafx.scene.layout.GridPane;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.model.terminal.txRx.macros.Macro;
import ninja.mbedded.ninjaterm.util.javafx.GridPaneHelper;
import ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx.macros.MacroRow;
import org.controlsfx.glyphfont.GlyphFont;

/**
 * View controller for the "Macro Settings" dialogue box.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-11-08
 * @last-modified 2016-11-08
 */
public class MacroSettingsViewController {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    private TextField nameTextField;

    @FXML
    private TextField sequenceTextField;

    @FXML
    public Button cancelButton;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//


    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public MacroSettingsViewController() {
    }

    public void init(Model model, Terminal terminal, GlyphFont glyphFont) {

    }
}
