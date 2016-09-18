package ninja.mbedded.ninjaterm.view.mainwindow.terminal.rxtx.display;

import javafx.beans.binding.Bindings;
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

        //==============================================//
        //=========== SETUP TX RADIOBUTTONS ============//
        //==============================================//

        ToggleGroupValue<Display.TxCharSendingOptions> toggleGroup = new ToggleGroupValue();
        toggleGroup.add(sendTxCharsImmediatelyRadioButton, Display.TxCharSendingOptions.SEND_TX_CHARS_IMMEDIATELY);
        toggleGroup.add(sendTxCharsOnEnterRadioButton, Display.TxCharSendingOptions.SEND_TX_CHARS_ON_ENTER);

        Bindings.bindBidirectional(toggleGroup.valueProperty(), terminal.txRx.display.selTxCharSendingOption);

        /*toggleGroup.valueProperty().addListener((observable, oldValue, newValue) -> {
            System.out.println("ToggleGroup selection changed!");

            if(newValue == sendTxCharsImmediatelyRadioButton) {
                terminal.txRx.display.selTxCharSendingOption.set(Display.TxCharSendingOptions.SEND_TX_CHARS_IMMEDIATELY);
            } else if(newValue == sendTxCharsOnEnterRadioButton) {
                terminal.txRx.display.selTxCharSendingOption.set(Display.TxCharSendingOptions.SEND_TX_CHARS_ON_ENTER);
            } else {
                throw new RuntimeException("Radio button selection not recognised!");
            }

        });*/



        //==============================================//
        //============= SETUP LOCAL TX ECHO ============//
        //==============================================//

        // Bind the model boolean to the checkbox
        terminal.txRx.display.localTxEcho.bind(localTxEchoCheckBox.selectedProperty());

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

        //==============================================//
        //================ SETUP WRAPPING ==============//
        //==============================================//

        // Bind "wrapping enabled" checkbox to model
        terminal.txRx.display.wrappingEnabled.bind(wrappingCheckBox.selectedProperty());

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

    }
}
