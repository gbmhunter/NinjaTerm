package ninja.mbedded.ninjaterm.view.mainwindow.terminal.rxtx.formatting;

import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Label;
import javafx.scene.layout.VBox;
import ninja.mbedded.ninjaterm.util.Decoding.Decoder;
import ninja.mbedded.ninjaterm.util.Decoding.DecodingOptions;

import java.io.IOException;

/**
 * Controller for the formatting pop-up window.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-08-24
 * @last-modified   2016-08-25
 */
public class Formatting extends VBox {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    public Label decodingLabel;

    @FXML
    public ComboBox<DecodingOptions> decodingComboBox;


    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    private Decoder decoder;

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public Formatting(Decoder decoder) {

        this.decoder = decoder;

        FXMLLoader fxmlLoader = new FXMLLoader(getClass().getResource(
                "Formatting.fxml"));

        fxmlLoader.setRoot(this);
        fxmlLoader.setController(this);

        try {
            fxmlLoader.load();
        } catch (IOException exception) {
            throw new RuntimeException(exception);
        }

        // UI should now be initialised

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
