package ninja.mbedded.ninjaterm.view.mainWindow.terminal.stats;

import javafx.beans.binding.Bindings;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.value.ChangeListener;
import javafx.beans.value.ObservableValue;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Label;
import javafx.scene.layout.VBox;
import javafx.util.converter.NumberStringConverter;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.model.terminal.stats.Stats;

import java.io.IOException;

/**
 * Controller for the "StatsView" sub-tab which is part of a terminal tab.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-09-16
 * @last-modified 2016-09-22
 */
public class StatsView extends VBox {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    private Label characterCountTxLabel;

    @FXML
    private Label characterCountRxLabel;

    @FXML
    private Label bufferSizesTxLabel;

    @FXML
    private Label bufferSizesRxLabel;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    private Terminal terminal;

    public StatsView() {

        FXMLLoader fxmlLoader = new FXMLLoader(getClass().getResource(
                "StatsView.fxml"));

        fxmlLoader.setRoot(this);
        fxmlLoader.setController(this);

        try {
            fxmlLoader.load();
        } catch (IOException exception) {
            throw new RuntimeException(exception);
        }

    }

    public void init(Terminal terminal) {

        this.terminal = terminal;

        //==============================================//
        //=========== CHARACTER COUNT SETUP ============//
        //==============================================//

        //======================= RX ===================//
        characterCountTxLabel.setText(Integer.toString(terminal.stats.numCharactersTx.getValue()));
        terminal.stats.numCharactersTx.addListener((observable, oldValue, newValue) -> {
            // Convert new value into string and update label
            characterCountTxLabel.setText(Integer.toString(newValue.intValue()));
        });

        //======================= TX ===================//
        characterCountRxLabel.setText(Integer.toString(terminal.stats.numCharactersRx.getValue()));
        terminal.stats.numCharactersRx.addListener((observable, oldValue, newValue) -> {
            // Convert new value into string and update label
            characterCountRxLabel.setText(Integer.toString(newValue.intValue()));
        });

        //==============================================//
        //============= BUFFER SIZE SETUP ==============//
        //==============================================//

        //======================= TX ===================//
        ChangeListener<String> bufferSizesTxChangeListener = (observable, oldValue, newValue) -> {
                bufferSizesTxLabel.setText(Integer.toString(terminal.txRx.txData.get().length()));
        };
        terminal.txRx.txData.addListener(bufferSizesTxChangeListener);
        // Set default (giving bogus data as it is not used)
        bufferSizesTxChangeListener.changed(new SimpleStringProperty(), "", "");

        //======================= RX ===================//
        ChangeListener<String> bufferSizesRxChangeListener = (observable, oldValue, newValue) -> {
            bufferSizesRxLabel.setText(Integer.toString(terminal.txRx.rxData.get().length()));
        };
        terminal.txRx.rxData.addListener(bufferSizesRxChangeListener);
        // Set default (giving bogus data as it is not used)
        bufferSizesRxChangeListener.changed(new SimpleStringProperty(), "", "");

    }

}
