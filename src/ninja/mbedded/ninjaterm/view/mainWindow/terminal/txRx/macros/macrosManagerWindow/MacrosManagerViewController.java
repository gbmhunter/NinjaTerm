package ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx.macros.macrosManagerWindow;

import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;
import javafx.stage.WindowEvent;
import javafx.util.Callback;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.model.terminal.txRx.macros.Encodings;
import ninja.mbedded.ninjaterm.model.terminal.txRx.macros.Macro;
import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import ninja.mbedded.ninjaterm.util.tooltip.TooltipUtil;
import org.slf4j.Logger;

/**
 * View controller for the "Macro Settings" dialogue box.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @last-modified 2016-11-08
 * @since 2016-11-08
 */
public class MacrosManagerViewController {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    private VBox rootVBox;

    @FXML
    private Button deleteMacroButton;

    @FXML
    private ListView<Macro> macrosListView;

    @FXML
    private TextField nameTextField;

    @FXML
    private ComboBox<Encodings> encodingComboBox;

    @FXML
    private TextField sequenceTextField;

    @FXML
    private CheckBox sendSequenceImmediatelyCheckBox;

    @FXML
    private Button okButton;

    @FXML
    public Button cancelButton;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    Model model;
    Terminal terminal;

    private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public MacrosManagerViewController() {
    }

    public void init(Model model, Terminal terminal, Macro macro) {

        this.model = model;
        this.terminal = terminal;

        //==============================================//
        //========= DELETE MACRO BUTTON SETUP ==========//
        //==============================================//

        deleteMacroButton.setOnAction(event -> {
            terminal.txRx.macroManager.deleteMacro(macrosListView.getSelectionModel().getSelectedItem());
        });

        //==============================================//
        //=========== MACROS LISTVIEW SETUP ============//
        //==============================================//

        macrosListView.setItems(terminal.txRx.macroManager.macros);

        // Set a custom cell factory which will display the macro's name
        // in the ListView pane
        macrosListView.setCellFactory(new Callback<ListView<Macro>, ListCell<Macro>>() {

            @Override
            public ListCell<Macro> call(ListView<Macro> param) {
                ListCell<Macro> cell = new ListCell<Macro>() {

                    @Override
                    protected void updateItem(Macro item, boolean empty) {
                        super.updateItem(item, empty);
                        if (item != null) {
                            // THIS IS THE IMPORTANT LINE
                            setText(item.name.get());
                        } else {
                            setText("");
                        }
                    }
                };
                return cell;
            }
        });

        macrosListView.getSelectionModel().selectedItemProperty().addListener((observable, oldValue, newValue) -> {
            // The user has selected a different macro in the list view, update the
            // right-hand side display
            updateDisplayedMacro(newValue);
        });

        //==============================================//
        //============ NAME TEXTFIELD SETUP ============//
        //==============================================//

        nameTextField.textProperty().set(macro.name.get());

        TooltipUtil.addDefaultTooltip(encodingComboBox, "You can give this macro a name to easily identify it among all the other macros on the right-hand side pane on the TX/RX sub-tab.");

        //==============================================//
        //=========== ENCODING COMBOBOX SETUP ==========//
        //==============================================//

        encodingComboBox.getItems().setAll(Encodings.values());
        // Copy selected item from model
        encodingComboBox.getSelectionModel().select(macro.encoding.get());

        TooltipUtil.addDefaultTooltip(encodingComboBox, "Choose the encoding of the sequence. The entered sequence must be valid for the specified encoding.");

        //==============================================//
        //=========== SEQUENCE TEXTFIELD SETUP =========//
        //==============================================//

        sequenceTextField.textProperty().set(macro.sequence.get());
        TooltipUtil.addDefaultTooltip(sequenceTextField, "The sequence of data to send when this macro's send button is pressed. This sequence must be valid for the chosen encoding.");

        //==============================================//
        //== SEND SEQUENCE IMMEDIATELY CHECKBOX SETUP ==//
        //==============================================//

        // Set default state from model
        sendSequenceImmediatelyCheckBox.setSelected(macro.sendSequenceImmediately.get());

        TooltipUtil.addDefaultTooltip(sendSequenceImmediatelyCheckBox, "When ticked, the macro's sequence will be sent as soon as the \"send\" button is pressed. If unticked, the send behaviour will depend on the \"Send Behaviour\" in the Formatting pop-up.");

        //==============================================//
        //=============== OK BUTTON SETUP ==============//
        //==============================================//

        okButton.setOnAction(event -> {
            // Copy the values from the dialogue controls into the model, then
            // close
            macro.name.set(nameTextField.textProperty().get());
            macro.encoding.set(encodingComboBox.getValue());
            macro.sequence.set(sequenceTextField.textProperty().get());
            macro.sendSequenceImmediately.set(sendSequenceImmediatelyCheckBox.isSelected());

            close();
        });

        //==============================================//
        //============= CANCEL BUTTON SETUP ============//
        //==============================================//

        cancelButton.setOnAction(event -> {
            // Close without setting the values from the controls into the
            // model (i.e. loose changes)
            close();
        });

    }

    private void updateDisplayedMacro(Macro macro) {
        logger.debug("updateDisplayedMacro() called.");
    }

    private void close() {
        // This closes the stage the "clean" way, which causes all OnCloseRequest event handler
        // to be called correctly
        Stage stage = (Stage) rootVBox.getScene().getWindow();
        stage.fireEvent(
                new WindowEvent(
                        stage,
                        WindowEvent.WINDOW_CLOSE_REQUEST
                )
        );
    }

}
