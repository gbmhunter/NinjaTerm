package ninja.mbedded.ninjaterm.view.mainWindow.terminal.stats;

import javafx.beans.property.SimpleDoubleProperty;
import javafx.beans.value.ChangeListener;
import javafx.fxml.FXML;
import javafx.scene.control.Label;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;

/**
 * Controller for the "StatsView" sub-tab which is part of a terminal tab.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-09-16
 * @last-modified 2016-11-22
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
    private Label numCharsInTxBufferLabel;

    @FXML
    private Label numCharsInRxBufferLabel;

    @FXML
    private Label bytesPerSecondTxLabel;

    @FXML
    private Label bytesPerSecondRxLabel;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    private Terminal terminal;

    public StatsViewController() { }

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public void init(Terminal terminal) {

        this.terminal = terminal;

        //==============================================//
        //========= NUM. CHARS IN BUFFER SETUP =========//
        //==============================================//

        //======================= TX ===================//
        terminal.stats.numCharsInTxDisplayBuffer.addListener((observable, oldValue, newValue) -> {
            numCharsInTxBufferLabel.textProperty().set(Integer.toString(terminal.stats.numCharsInTxDisplayBuffer.get()));
        });
        // Set default value
        numCharsInTxBufferLabel.textProperty().set(Integer.toString(terminal.stats.numCharsInTxDisplayBuffer.get()));

        //======================= RX ===================//
        terminal.stats.numCharsInRxDisplayBuffer.addListener((observable, oldValue, newValue) -> {
            numCharsInRxBufferLabel.textProperty().set(Integer.toString(terminal.stats.numCharsInRxDisplayBuffer.get()));
        });
        // Set default value
        numCharsInRxBufferLabel.textProperty().set(Integer.toString(terminal.stats.numCharsInRxDisplayBuffer.get()));

        //==============================================//
        //========= TOTAL CHARACTER COUNT SETUP ========//
        //==============================================//

        //======================= RX ===================//
        characterCountTxLabel.setText(Integer.toString(terminal.stats.totalNumCharsTx.getValue()));
        terminal.stats.totalNumCharsTx.addListener((observable, oldValue, newValue) -> {
            // Convert new value into string and update label
            characterCountTxLabel.setText(Integer.toString(newValue.intValue()));
        });

        //======================= TX ===================//
        characterCountRxLabel.setText(Integer.toString(terminal.stats.totalNumCharsRx.getValue()));
        terminal.stats.totalNumCharsRx.addListener((observable, oldValue, newValue) -> {
            // Convert new value into string and update label
            characterCountRxLabel.setText(Integer.toString(newValue.intValue()));
        });

        //==============================================//
        //============= BYTES/SECOND SETUP =============//
        //==============================================//

        //======================= TX ===================//
        ChangeListener<Number> bytesPerSecondTxChangeListener = (observable, oldValue, newValue) -> {
            bytesPerSecondTxLabel.setText(Double.toString(newValue.doubleValue()));
        };
        terminal.stats.bytesPerSecondTx.addListener(bytesPerSecondTxChangeListener);

        // Set default (giving bogus data as it is not used)
        bytesPerSecondTxChangeListener.changed(new SimpleDoubleProperty(), 0.0, 0.0);

        //======================= RX ===================//
        ChangeListener<Number> bytesPerSecondRxChangeListener = (observable, oldValue, newValue) -> {
            bytesPerSecondRxLabel.setText(Double.toString(newValue.doubleValue()));
        };
        terminal.stats.bytesPerSecondRx.addListener(bytesPerSecondRxChangeListener);

        // Set default (giving bogus data as it is not used)
        bytesPerSecondRxChangeListener.changed(new SimpleDoubleProperty(), 0.0, 0.0);

    }

}
