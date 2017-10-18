package ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx.display;

import javafx.beans.binding.Bindings;
import javafx.beans.value.ChangeListener;
import javafx.fxml.FXML;
import javafx.scene.control.CheckBox;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Control;
import javafx.scene.control.RadioButton;
import javafx.util.converter.NumberStringConverter;
import jfxtras.scene.control.ToggleGroupValue;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.model.terminal.txRx.display.Display;
import ninja.mbedded.ninjaterm.model.terminal.txRx.formatting.Formatting;
import ninja.mbedded.ninjaterm.util.javafx.applyTextField.ApplyTextField;
import ninja.mbedded.ninjaterm.util.tooltip.TooltipUtil;
import org.controlsfx.validation.Severity;
import org.controlsfx.validation.ValidationResult;
import org.controlsfx.validation.ValidationSupport;
import org.controlsfx.validation.Validator;

/**
 * View controller for the "display" settings pop-up window.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-09-16
 * @last-modified 2016-11-22
 */
public class DisplayViewController {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    private ComboBox<Display.LayoutOptions> layoutOptionsComboBox;

    @FXML
    private CheckBox localTxEchoCheckBox;

    @FXML
    private CheckBox backspaceRemovesLastTypedCharCheckBox;

    @FXML
    private CheckBox wrappingCheckBox;

    @FXML
    private ApplyTextField wrappingWidthTextField;

    @FXML
    private ApplyTextField bufferSizeTextField;

    //==============================================//
    //=============== SCROLL BEHAVIOUR =============//
    //==============================================//

//    @FXML
//    private RadioButton scrollBehaviourStandardRadioButton;
//
//    @FXML
//    private RadioButton scrollBehaviourSmartRadioButton;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//


    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public DisplayViewController() {
    }

    public void init(Model model, Terminal terminal) {

        //==============================================//
        //================ DECODING SETUP ==============//
        //==============================================//

        // Populate decoding options combobox
        layoutOptionsComboBox.getItems().setAll(Display.LayoutOptions.values());

        // Add listener to combobox
        layoutOptionsComboBox.setOnAction(event -> {

            // Bind the decoder decoding option to what has been selected in the
            // combobox
            terminal.txRx.display.selLayoutOption.set(layoutOptionsComboBox.getSelectionModel().getSelectedItem());
        });

        // Set default
        layoutOptionsComboBox.getSelectionModel().select(terminal.txRx.display.selLayoutOption.get());

        TooltipUtil.addDefaultTooltip(layoutOptionsComboBox, "Separate mode displays a separate pane for RX data (top), and TX data (bottom). Combined mode shows one pane for both RX and TX data (if local echo is enabled). Combined mode with local echo turned on behaves similarly to a terminal.");

        //==============================================//
        //============= SETUP LOCAL TX ECHO ============//
        //==============================================//

        // Bind the model boolean to the checkbox
        terminal.txRx.display.localTxEcho.bind(localTxEchoCheckBox.selectedProperty());

        TooltipUtil.addDefaultTooltip(localTxEchoCheckBox, "If enabled, sent TX data will be copied (echoed) into the RX display.");

        //==============================================//
        //=============== BACKSPACE SETUP ==============//
        //==============================================//

        Bindings.bindBidirectional(
                backspaceRemovesLastTypedCharCheckBox.selectedProperty(),
                terminal.txRx.display.backspaceRemovesLastTypedChar);

        // Enable this checkbox only if the selected TX sending option is
        // on press on the "enter" key (this is the only way that this functionality makes sense)
        ChangeListener<Formatting.TxCharSendingOptions> changeListener = (observable, oldValue, newValue) -> {
            switch (newValue) {
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
        terminal.txRx.formatting.selTxCharSendingOption.addListener(changeListener);

        // Update disabled state to default
        changeListener.changed(
                terminal.txRx.formatting.selTxCharSendingOption,
                terminal.txRx.formatting.selTxCharSendingOption.get(),
                terminal.txRx.formatting.selTxCharSendingOption.get());

        TooltipUtil.addDefaultTooltip(backspaceRemovesLastTypedCharCheckBox, "Enabling this will allow you to use backspace to delete TX chars before they are sent (on applicable if 'Send TX chars on enter' is selected). Disabling this will instead send the backspace character to the COM port.");

        //==============================================//
        //================ SETUP WRAPPING ==============//
        //==============================================//

        // Set default value from model
        wrappingCheckBox.selectedProperty().setValue(terminal.txRx.display.wrappingEnabled.get());
        wrappingCheckBox.selectedProperty().addListener((observable, oldValue, newValue) -> {
            terminal.txRx.display.wrappingEnabled.set(newValue);
        });

        // Bind "wrapping enabled" checkbox to model
//        terminal.txRx.display.wrappingEnabled.bind(wrappingCheckBox.selectedProperty());

        TooltipUtil.addDefaultTooltip(wrappingCheckBox, "Enable this to wrap at a certain pixel width (as defined below). If this is disabled, long lines of TX/RX text will cause horizontal scroll-bars to appear.");

        // Upon pressing enter or loosing focus, try and convert the wrapping width value and
        // update the model
        wrappingWidthTextField.onApply.addListener((observable, oldValue, newValue) -> {
            // Convert wrapping width string into double, and then perform
            // sanity checks
            Double wrappingWidth;
            try {
                wrappingWidth = Double.parseDouble(newValue);
            } catch (NumberFormatException e) {
                model.status.addErr("Wrapping width was not a valid number.");
                wrappingWidth = 0.0;
            }

            if (wrappingWidth <= 0.0) {
                model.status.addErr("Wrapping width must be greater than 0.");
                wrappingWidth = 0.0;
            }

            terminal.txRx.display.wrappingWidth.set(wrappingWidth);
        });

        // Set default value from model
        // (we assume the value in the model to be valid and no checking needed)
        wrappingWidthTextField.textProperty().set(Double.toString(terminal.txRx.display.wrappingWidth.get()));


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
        Bindings.bindBidirectional(
                bufferSizeTextField.onApply,
                terminal.txRx.display.bufferSizeChars,
                new NumberStringConverter() {
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
                        return ((Integer) value).toString();
                    }
                });

        // Add validation support for the buffer size
        ValidationSupport support = new ValidationSupport();

        Validator<String> validator = (Control control, String value) ->
        {
            boolean condition;
            try {
                Integer.parseInt(value);
                condition = false;
            } catch (RuntimeException e) {
                condition = true;
            }

            return ValidationResult.fromMessageIf(control, "Not a valid integer", Severity.ERROR, condition);
        };

        support.registerValidator(bufferSizeTextField, true, validator);

        TooltipUtil.addDefaultTooltip(bufferSizeTextField, "The max. number of characters to store in the TX and RX panes. Once the num. of characters exceeds this limit, the oldest characters are removed from the UI (this does not affect logging).");

        //==============================================//
        //=========== SCROLL BEHAVIOUR SETUP ===========//
        //==============================================//

//        ToggleGroupValue<Display.ScrollBehaviour> scrollBehaviourToggleGroup = new ToggleGroupValue();
//        scrollBehaviourToggleGroup.add(scrollBehaviourStandardRadioButton, Display.ScrollBehaviour.STANDARD);
//        scrollBehaviourToggleGroup.add(scrollBehaviourSmartRadioButton, Display.ScrollBehaviour.SMART);
//
//        Bindings.bindBidirectional(scrollBehaviourToggleGroup.valueProperty(), terminal.txRx.display.scrollBehaviour);
//
//        TooltipUtil.addDefaultTooltip(scrollBehaviourStandardRadioButton, "When the RX buffer is full, the RX pane will not scroll automatically to keep the same lines of RX text in view.");
//        TooltipUtil.addDefaultTooltip(scrollBehaviourSmartRadioButton, "When the RX buffer is full, the RX pane will scroll automatically to keep the same lines of RX text in view (only when scroll-to-bottom is not currently active).");

    }
}
