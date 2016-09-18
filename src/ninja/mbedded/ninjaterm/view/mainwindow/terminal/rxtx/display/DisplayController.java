package ninja.mbedded.ninjaterm.view.mainwindow.terminal.rxtx.display;

import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.*;
import javafx.scene.layout.VBox;
import ninja.mbedded.ninjaterm.model.terminal.txRx.layout.Layout;
import ninja.mbedded.ninjaterm.util.Decoding.Decoder;
import ninja.mbedded.ninjaterm.util.Decoding.DecodingOptions;

import java.io.IOException;

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
    public ComboBox<Layout.LayoutOptions> layoutOptionsComboBox;

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

    public void init(Layout layout, Decoder decoder) {

        // Populate decoding options combobox
        layoutOptionsComboBox.getItems().setAll(Layout.LayoutOptions.values());

        // Add listener to combobox
        layoutOptionsComboBox.setOnAction(event -> {

            // Bind the decoder decoding option to what has been selected in the
            // combobox
            layout.selectedLayoutOption.set(layoutOptionsComboBox.getSelectionModel().getSelectedItem());
        });

        // Set default
        layoutOptionsComboBox.getSelectionModel().select(layout.selectedLayoutOption.get());

        //==============================================//
        //============= SETUP RADIOBUTTONS =============//
        //==============================================//

        ToggleGroup toggleGroup = new ToggleGroup();
        sendTxCharsImmediatelyRadioButton.setToggleGroup(toggleGroup);
        sendTxCharsOnEnterRadioButton.setToggleGroup(toggleGroup);


        // Bind the model boolean to the checkbox
        layout.localTxEcho.bind(localTxEchoCheckBox.selectedProperty());

        // Populate decoding options combobox
        decodingComboBox.getItems().setAll(DecodingOptions.values());

        // Add listener to combobox
        decodingComboBox.setOnAction(event -> {

            // Bind the decoder decoding option to what has been selected in the
            // combobox
            decoder.decodingOption = decodingComboBox.getSelectionModel().getSelectedItem();
        });

        // Set default
        decodingComboBox.getSelectionModel().select(DecodingOptions.UTF8);

    }

}
