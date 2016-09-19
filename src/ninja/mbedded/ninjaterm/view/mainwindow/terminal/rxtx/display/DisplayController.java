package ninja.mbedded.ninjaterm.view.mainwindow.terminal.rxtx.display;

import javafx.beans.binding.Bindings;
import javafx.beans.value.ChangeListener;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.*;
import javafx.scene.layout.VBox;
import javafx.util.converter.NumberStringConverter;
import jfxtras.scene.control.ToggleGroupValue;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.model.terminal.txRx.display.Display;
import ninja.mbedded.ninjaterm.util.Decoding.Decoder;
import ninja.mbedded.ninjaterm.util.Decoding.DecodingOptions;
import ninja.mbedded.ninjaterm.util.tooltip.TooltipUtil;
import org.controlsfx.control.textfield.CustomTextField;
import org.controlsfx.validation.Severity;
import org.controlsfx.validation.ValidationResult;
import org.controlsfx.validation.ValidationSupport;
import org.controlsfx.validation.Validator;

import java.io.IOException;
import java.text.FieldPosition;
import java.text.Format;
import java.text.ParsePosition;

/**
 * Controller for the layout pop-up window.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-09-16
 * @last-modified 2016-09-16
 */
public class DisplayController extends VBox {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    public ComboBox<Display.LayoutOptions> layoutOptionsComboBox;

    @FXML
    public RadioButton sendTxCharsImmediatelyRadioButton;

    @FXML
    public RadioButton sendTxCharsOnEnterRadioButton;

    @FXML
    public CheckBox localTxEchoCheckBox;

    @FXML
    public CheckBox backspaceRemovesLastTypedCharCheckBox;

    @FXML
    public Tooltip backspaceRemovesLastTypeCharTooltip;

    @FXML
    public Label decodingLabel;

    @FXML
    public ComboBox<DecodingOptions> decodingComboBox;

    @FXML
    public CheckBox wrappingCheckBox;

    @FXML
    public TextField wrappingWidthTextField;

    @FXML
    public TextField bufferSizeTextField;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//


    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public DisplayController() {

        FXMLLoader fxmlLoader = new FXMLLoader(getClass().getResource(
                "DisplayView.fxml"));

        fxmlLoader.setRoot(this);
        fxmlLoader.setController(this);

        try {
            fxmlLoader.load();
        } catch (IOException exception) {
            throw new RuntimeException(exception);
        }

    }

    public void init(Model model, Terminal terminal, Decoder decoder) {

        // Populate decoding options combobox
        layoutOptionsComboBox.getItems().setAll(Display.LayoutOptions.values());

        // Add listener to combobox
        layoutOptionsComboBox.setOnAction(event -> {

            // Bind the decoder decoding option to what has been selected in the
            // combobox
            terminal.txRx.display.selectedLayoutOption.set(layoutOptionsComboBox.getSelectionModel().getSelectedItem());
        });

        // Set default
        layoutOptionsComboBox.getSelectionModel().select(terminal.txRx.display.selectedLayoutOption.get());

        TooltipUtil.addDefaultTooltip(layoutOptionsComboBox, "Separate mode displays a separate pane for RX data (top), and TX data (bottom). Combined mode shows one pane for both RX and TX data (if local echo is enabled). Combined mode with local echo turned on behaves similarly to a terminal.");

        //==============================================//
        //=========== SETUP TX RADIOBUTTONS ============//
        //==============================================//

        ToggleGroupValue<Display.TxCharSendingOptions> toggleGroup = new ToggleGroupValue();
        toggleGroup.add(sendTxCharsImmediatelyRadioButton, Display.TxCharSendingOptions.SEND_TX_CHARS_IMMEDIATELY);
        toggleGroup.add(sendTxCharsOnEnterRadioButton, Display.TxCharSendingOptions.SEND_TX_CHARS_ON_ENTER);

        Bindings.bindBidirectional(toggleGroup.valueProperty(), terminal.txRx.display.selTxCharSendingOption);

        TooltipUtil.addDefaultTooltip(sendTxCharsImmediatelyRadioButton, "TX characters will be sent as soon as they are typed.");
        TooltipUtil.addDefaultTooltip(sendTxCharsOnEnterRadioButton, "TX characters will only be sent when \"ENTER\" is pressed.");

        //==============================================//
        //============= SETUP LOCAL TX ECHO ============//
        //==============================================//

        // Bind the model boolean to the checkbox
        terminal.txRx.display.localTxEcho.bind(localTxEchoCheckBox.selectedProperty());

        TooltipUtil.addDefaultTooltip(localTxEchoCheckBox, "If enabled, sent TX data will be copied (echoed) into the RX display.");

        //==============================================//
        //============== SETUP TX DECODING =============//
        //==============================================//

        // Populate decoding options combobox
        decodingComboBox.getItems().setAll(DecodingOptions.values());

        // Add listener to combobox
        decodingComboBox.setOnAction(event -> {

            // Bind the decoder decoding option to what has been selected in the
            // combobox
            decoder.decodingOption = decodingComboBox.getSelectionModel().getSelectedItem();
        });

        // Set default
        decodingComboBox.getSelectionModel().select(DecodingOptions.ASCII);

        TooltipUtil.addDefaultTooltip(decodingComboBox, "The incoming RX data will be decoded according to this selection. \"ASCII\" is one of the most popular choices.");

        //==============================================//
        //=============== BACKSPACE SETUP ==============//
        //==============================================//

        Bindings.bindBidirectional(
                backspaceRemovesLastTypedCharCheckBox.selectedProperty(),
                terminal.txRx.display.backspaceRemovesLastTypedChar);

        // Enable this checkbox only if the selected TX sending option is
        // on press on the "enter" key (this is the only way that this functionality makes sense)
        ChangeListener<Display.TxCharSendingOptions> changeListener = (observable, oldValue, newValue) -> {
            switch(newValue) {
                case SEND_TX_CHARS_IMMEDIATELY:
                    backspaceRemovesLastTypedCharCheckBox.setDisable(true);
                    break;
                case SEND_TX_CHARS_ON_ENTER:
                    backspaceRemovesLastTypedCharCheckBox.setDisable(false);
                    break;
                default:
                    throw new RuntimeException("TxCharSendingOptions option not recognised.");
            }
        };
        terminal.txRx.display.selTxCharSendingOption.addListener(changeListener);

        // Update disabled state to default
        changeListener.changed(
                terminal.txRx.display.selTxCharSendingOption,
                terminal.txRx.display.selTxCharSendingOption.get(),
                terminal.txRx.display.selTxCharSendingOption.get());

        TooltipUtil.addDefaultTooltip(backspaceRemovesLastTypedCharCheckBox, "Enabling this will allow you to use backspace to delete TX chars before they are sent (on applicable if 'Send TX chars on enter' is selected). Disabling this will instead send the backspace character to the COM port.");

        //==============================================//
        //================ SETUP WRAPPING ==============//
        //==============================================//

        // Bind "wrapping enabled" checkbox to model
        terminal.txRx.display.wrappingEnabled.bind(wrappingCheckBox.selectedProperty());

        TooltipUtil.addDefaultTooltip(wrappingCheckBox, "Enable this to wrap at a certain pixel width (as defined below). If this is disabled, long lines of TX/RX text will cause horizontal scroll-bars to appear.");

        // Perform a bi-directional bind, with custom string-to-number conversion which takes care
        // of any errors.
        Bindings.bindBidirectional(wrappingWidthTextField.textProperty(), terminal.txRx.display.wrappingWidth, new NumberStringConverter() {
            @Override
            public Number fromString(String value) {
                System.out.println("Converting from string.");

                // Convert wrapping width string into double, and then perform
                // sanity checks
                Double wrappingWidth;
                try {
                    wrappingWidth = Double.parseDouble(value);
                } catch (NumberFormatException e) {
                    model.status.addErr("Wrapping width was not a valid number.");
                    return 0.0;
                }

                if (wrappingWidth <= 0.0) {
                    model.status.addErr("Wrapping width must be greater than 0.");
                    return 0.0;
                }

                return wrappingWidth;
            }
        });

        // Disable the wrapping width textfield if wrapping is disabled.
        terminal.txRx.display.wrappingEnabled.addListener((observable, oldValue, newValue) -> {
            wrappingWidthTextField.setDisable(!newValue);
        });

        // Set default state
        wrappingWidthTextField.setDisable(!terminal.txRx.display.wrappingEnabled.get());

        TooltipUtil.addDefaultTooltip(wrappingWidthTextField, "The width (in pixels) that you want TX/RX data to wrap at.");

        //==============================================//
        //============== BUFFER-SIZE SETUP =============//
        //==============================================//

        // Perform a bi-directional bind, with custom string-to-number conversion which takes care
        // of any errors.
        Bindings.bindBidirectional(bufferSizeTextField.textProperty(), terminal.txRx.display.bufferSizeChars, new NumberStringConverter() {
            @Override
            public Number fromString(String value) {

                // Convert wrapping width string into double, and then perform
                // sanity checks
                Integer intValue;
                try {
                    intValue = Integer.parseInt(value);
                } catch (NumberFormatException e) {
                    model.status.addErr("Buffer size is not a valid integer.");
                    return terminal.txRx.display.DEFAULT_BUFFER_SIZE_CHARS;
                }

                if (intValue <= 0.0) {
                    model.status.addErr("Buffer size must be greater than 0.");
                    return terminal.txRx.display.DEFAULT_BUFFER_SIZE_CHARS;
                }

                return intValue;
            }

            @Override
            public String toString(Number value) {
                return ((Integer)value).toString();
            }
        });

        ValidationSupport support = new ValidationSupport();

        Validator<String> validator = (Control control, String value) ->
            {
                boolean condition;
                try {
                    Integer.parseInt(value);
                    condition = false;
                } catch(RuntimeException e) {
                    condition = true;
                }

                return ValidationResult.fromMessageIf(control, "Not a valid integer", Severity.ERROR, condition );
            }
        ;

        support.registerValidator(bufferSizeTextField, true, validator );

        TooltipUtil.addDefaultTooltip(bufferSizeTextField, "The max. number of characters to store in the TX and RX panes. Once the num. of characters exceeds this limit, the oldest characters are deleted from memory.");

    }
}
