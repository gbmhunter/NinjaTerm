package ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx.formatting;

import javafx.beans.binding.Bindings;
import javafx.fxml.FXML;
import javafx.scene.control.ComboBox;
import javafx.scene.control.RadioButton;
import javafx.scene.control.TextField;
import jfxtras.scene.control.ToggleGroupValue;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.model.terminal.txRx.formatting.Formatting;
import ninja.mbedded.ninjaterm.util.javafx.applyTextField.ApplyTextField;
import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import ninja.mbedded.ninjaterm.util.rxProcessing.Decoding.DecodingOptions;
import ninja.mbedded.ninjaterm.util.tooltip.TooltipUtil;
import org.slf4j.Logger;

/**
 * Controller for the formatting pop-up window.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-09-26
 * @last-modified 2016-10-18
 */
public class FormattingViewController {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    private ComboBox<DecodingOptions> decodingComboBox;

    //==============================================//
    //== WHEN TO INSERT NEW LINES IN THE RX DATA ===//
    //==============================================//

    @FXML
    private ApplyTextField rxNewLinePatternTextField;

    //==============================================//
    //==== WHAT TO SEND WHEN ENTER IS PRESSED ======//
    //==============================================//

    @FXML
    private RadioButton carriageReturnCheckBox;

    @FXML
    private RadioButton newLineCheckBox;

    @FXML
    private RadioButton carriageReturnAndNewLineCheckBox;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    Model model;
    Terminal terminal;

    ToggleGroupValue<Formatting.EnterKeyBehaviour> enterKeyBehaviourTGV = new ToggleGroupValue<>();

    private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public FormattingViewController() {
    }

    public void init(Model model, Terminal terminal) {

        this.model = model;
        this.terminal = terminal;

        //==============================================//
        //============== SETUP RX DECODING =============//
        //==============================================//

        // Populate decoding options combobox
        decodingComboBox.getItems().setAll(DecodingOptions.values());

        terminal.txRx.rxDataEngine.selDecodingOption.bind(decodingComboBox.getSelectionModel().selectedItemProperty());

        // Set default
        decodingComboBox.getSelectionModel().select(DecodingOptions.ASCII);

        TooltipUtil.addDefaultTooltip(decodingComboBox, "The incoming RX data will be decoded according to this selection. \"ASCII\" is one of the most popular choices. The colouriser (ANSI escape codes) are only available when the decoding is \"ASCII\".");

        //==============================================//
        //========== RX NEW LINE PATTERN SETUP =========//
        //==============================================//

        // Only send the new line pattern information to the model when either the
        // enter key is pressed, or the text field loses focus.
        rxNewLinePatternTextField.onApply.addListener((observable, oldValue, newValue) -> {
            terminal.txRx.rxDataEngine.newLinePattern.set(newValue);
        });

        // Get the default value from the model
        rxNewLinePatternTextField.textProperty().set(terminal.txRx.rxDataEngine.newLinePattern.get());

        TooltipUtil.addDefaultTooltip(rxNewLinePatternTextField, "This is the regex pattern which NinjaTerm will attempt to match incoming data with. If there is a match, a new line will be inserted into the output. A common value is \"\\n\", which will insert a new line everytime a ASCII new line control code is detected in the input. Leaving this field empty will result in no new lines being added. This is updated either when ENTER is pressed, or if the textfield loses focus.");

        //==============================================//
        //======== ENTER KEY TX BEHAVIOUR SETUP ========//
        //==============================================//

        enterKeyBehaviourTGV.add(carriageReturnCheckBox, Formatting.EnterKeyBehaviour.CARRIAGE_RETURN);
        enterKeyBehaviourTGV.add(newLineCheckBox, Formatting.EnterKeyBehaviour.NEW_LINE);
        enterKeyBehaviourTGV.add(carriageReturnAndNewLineCheckBox, Formatting.EnterKeyBehaviour.CARRIAGE_RETURN_AND_NEW_LINE);

        Bindings.bindBidirectional(enterKeyBehaviourTGV.valueProperty(), terminal.txRx.formatting.selEnterKeyBehaviour);

    }
}
