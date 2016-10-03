package ninja.mbedded.ninjaterm.view.mainWindow.terminal.stats;

import javafx.beans.property.SimpleStringProperty;
import javafx.beans.value.ChangeListener;
import javafx.fxml.FXML;
import javafx.scene.control.Label;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;

/**
 * Controller for the "StatsView" sub-tab which is part of a terminal tab.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @last-modified 2016-09-22
 * @since 2016-09-16
 */
public class StatsViewController {

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

    public StatsViewController() {

        /*FXMLLoader fxmlLoader = new FXMLLoader(getClass().getResource(
                "StatsView.fxml"));

        fxmlLoader.setRoot(this);
        fxmlLoader.setController(this);

        try {
            fxmlLoader.load();
        } catch (IOException exception) {
            throw new RuntimeException(exception);
        }*/

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
            bufferSizesRxLabel.setText(Integer.toString(terminal.txRx.rawRxData.get().length()));
        };
        terminal.txRx.rawRxData.addListener(bufferSizesRxChangeListener);
        // Set default (giving bogus data as it is not used)
        bufferSizesRxChangeListener.changed(new SimpleStringProperty(), "", "");

    }

}
