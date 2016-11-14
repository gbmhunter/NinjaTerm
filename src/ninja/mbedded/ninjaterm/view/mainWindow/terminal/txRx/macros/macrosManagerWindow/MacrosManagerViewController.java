package ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx.macros.macrosManagerWindow;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
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
 * This controller copies the entire macro array from the model before making any
 * changes, and only overwrites the one in the model if the "OK" button
 * is pressed.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @last-modified 2016-11-11
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

    private ObservableList<Macro> copyOfMacros;

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
        //===== COPY THE MACRO LIST FROM THE MODEL =====//
        //==============================================//

        // This performs a copy
        copyOfMacros = FXCollections.observableArrayList();
        for(Macro macroToCopy : terminal.txRx.macroManager.macros) {
            copyOfMacros.add(new Macro(macroToCopy));
        }

        //==============================================//
        //========= DELETE MACRO BUTTON SETUP ==========//
        //==============================================//

        deleteMacroButton.setOnAction(event -> {
            copyOfMacros.remove(macrosListView.getSelectionModel().getSelectedItem());
        });

        //==============================================//
        //=========== MACROS LISTVIEW SETUP ============//
        //==============================================//

        macrosListView.setItems(copyOfMacros);

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
            updateDisplayedMacro(oldValue, newValue);
        });

        // Select the first macro (if one exists)
        if(macrosListView.itemsProperty().get().size() > 0) {
            macrosListView.selectionModelProperty().get().select(0);
        }

        //==============================================//
        //============ NAME TEXTFIELD SETUP ============//
        //==============================================//

        TooltipUtil.addDefaultTooltip(encodingComboBox, "You can give this macro a name to easily identify it among all the other macros on the right-hand side pane on the TX/RX sub-tab.");

        //==============================================//
        //=========== ENCODING COMBOBOX SETUP ==========//
        //==============================================//

        encodingComboBox.getItems().setAll(Encodings.values());

        TooltipUtil.addDefaultTooltip(encodingComboBox, "Choose the encoding of the sequence. The entered sequence must be valid for the specified encoding.");

        //==============================================//
        //=========== SEQUENCE TEXTFIELD SETUP =========//
        //==============================================//

        TooltipUtil.addDefaultTooltip(sequenceTextField, "The sequence of data to send when this macro's send button is pressed. This sequence must be valid for the chosen encoding.");

        //==============================================//
        //== SEND SEQUENCE IMMEDIATELY CHECKBOX SETUP ==//
        //==============================================//

        TooltipUtil.addDefaultTooltip(sendSequenceImmediatelyCheckBox, "When ticked, the macro's sequence will be sent as soon as the \"send\" button is pressed. If unticked, the send behaviour will depend on the \"Send Behaviour\" in the Formatting pop-up.");

        //==============================================//
        //=============== OK BUTTON SETUP ==============//
        //==============================================//

        okButton.setOnAction(event -> {
            // Replace all of the macros in the model with the copied macros
            for(int i = 0; i < terminal.txRx.macroManager.macros.size(); i++) {
                terminal.txRx.macroManager.macros.set(i, copyOfMacros.get(i));
            }

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

    /**
     * Updates the displayed macro (right-hand pane).
     *
     * Bi-directionally binds the UI controls to the properties in the provided <code>macro</code>.
     * @param oldMacro      The old macro object to unbind from the UI controls.
     * @param newMacro      The new macro object to bind the UI controls to.
     */
    private void updateDisplayedMacro(Macro oldMacro, Macro newMacro) {
        logger.debug("updateDisplayedMacro() called.");

        // Un-bind old macro from UI controls (if there
        // was a previous macro)
        if(oldMacro != null) {
            nameTextField.textProperty().unbindBidirectional(oldMacro.name);
            oldMacro.encoding.unbind();
            sequenceTextField.textProperty().unbindBidirectional(oldMacro.sequence);
            sendSequenceImmediatelyCheckBox.selectedProperty().unbindBidirectional(oldMacro.sendSequenceImmediately);
        }

        // Bind new macro to the UI controls
        nameTextField.textProperty().bindBidirectional(newMacro.name);
        encodingComboBox.getSelectionModel().select(newMacro.encoding.get());
        newMacro.encoding.bind(encodingComboBox.getSelectionModel().selectedItemProperty());
        sequenceTextField.textProperty().bindBidirectional(newMacro.sequence);
        sendSequenceImmediatelyCheckBox.selectedProperty().bindBidirectional(newMacro.sendSequenceImmediately);
    }

    /**
     * Closes the "Macro Manager" window.
     */
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
