package ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx.formatting;

import javafx.beans.binding.Bindings;
import javafx.fxml.FXML;
import javafx.scene.control.CheckBox;
import javafx.scene.control.ComboBox;
import javafx.scene.control.RadioButton;
import jfxtras.scene.control.ToggleGroupValue;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.model.terminal.txRx.formatting.Formatting;
import ninja.mbedded.ninjaterm.util.Decoding.DecodingOptions;
import ninja.mbedded.ninjaterm.util.tooltip.TooltipUtil;

/**
 * Controller for the formatting pop-up window.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-09-26
 * @last-modified 2016-10-07
 */
public class FormattingViewController {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    private ComboBox<DecodingOptions> decodingComboBox;

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

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public FormattingViewController() {
    }

    public void init(Model model, Terminal terminal) {

        this.model = model;
        this.terminal = terminal;

        //==============================================//
        //============== SETUP TX DECODING =============//
        //==============================================//

        // Populate decoding options combobox
        decodingComboBox.getItems().setAll(DecodingOptions.values());

        terminal.txRx.rxDataEngine.selDecodingOption.bind(decodingComboBox.getSelectionModel().selectedItemProperty());

        // Add listener to combobox
        /*decodingComboBox.setOnAction(event -> {

            // Bind the decoder decoding option to what has been selected in the
            // combobox
            terminal.decoder.decodingOption = decodingComboBox.getSelectionModel().getSelectedItem();
        });*/

        // Set default
        decodingComboBox.getSelectionModel().select(DecodingOptions.ASCII);

        TooltipUtil.addDefaultTooltip(decodingComboBox, "The incoming RX data will be decoded according to this selection. \"ASCII\" is one of the most popular choices. The colouriser (ANSI escape codes) are only available when the decoding is \"ASCII\".");

        //==============================================//
        //========= ENTER KEY BEHAVIOUR SETUP ==========//
        //==============================================//

        enterKeyBehaviourTGV.add(carriageReturnCheckBox, Formatting.EnterKeyBehaviour.CARRIAGE_RETURN);
        enterKeyBehaviourTGV.add(newLineCheckBox, Formatting.EnterKeyBehaviour.NEW_LINE);
        enterKeyBehaviourTGV.add(carriageReturnAndNewLineCheckBox, Formatting.EnterKeyBehaviour.CARRIAGE_RETURN_AND_NEW_LINE);

        Bindings.bindBidirectional(enterKeyBehaviourTGV.valueProperty(), terminal.txRx.formatting.selEnterKeyBehaviour);

    }
}
