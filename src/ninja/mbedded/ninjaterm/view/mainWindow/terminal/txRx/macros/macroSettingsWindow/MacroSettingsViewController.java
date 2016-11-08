package ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx.macros.macroSettingsWindow;

import javafx.beans.binding.Bindings;
import javafx.fxml.FXML;
import javafx.scene.control.Button;
import javafx.scene.control.TextField;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;
import javafx.stage.WindowEvent;
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
    private VBox rootVBox;

    @FXML
    private TextField nameTextField;

    @FXML
    private TextField sequenceTextField;

    @FXML
    private Button okButton;

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

    public void init(Macro macro) {

        //==============================================//
        //===== COPY VALUES FROM MODEL INTO CONTROLS ===//
        //==============================================//

        nameTextField.textProperty().set(macro.name.get());
        sequenceTextField.textProperty().set(macro.sequence.get());

        okButton.setOnAction(event -> {
            // Copy the values from the textfields into the model, then
            // close
            macro.name.set(nameTextField.textProperty().get());
            macro.sequence.set(sequenceTextField.textProperty().get());

            close();
        });

        cancelButton.setOnAction(event -> {
            // Close without setting the values from the controls into the
            // model (i.e. loose changes)
            close();
        });

    }

    private void close() {
        // This closes the stage the "clean" way, which causes all OnCloseRequest event handler
        // to be called correctly
        Stage stage = (Stage)rootVBox.getScene().getWindow();
        stage.fireEvent(
                new WindowEvent(
                        stage,
                        WindowEvent.WINDOW_CLOSE_REQUEST
                )
        );
    }
}
