package ninja.mbedded.ninjaterm.view.mainWindow.terminal.stats;

import javafx.beans.property.SimpleDoubleProperty;
import javafx.beans.value.ChangeListener;
import javafx.fxml.FXML;
import javafx.scene.control.Label;
import javafx.scene.layout.VBox;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.util.tooltip.TooltipUtil;

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
    private VBox totalRawCharCountVBox;

    @FXML
    private Label totalRawCharCountTxLabel;

    @FXML
    private Label totalRawCharCountRxLabel;

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
        //========= TOTAL RAW CHAR COUNT SETUP ========//
        //==============================================//

        TooltipUtil.addDefaultTooltip(totalRawCharCountVBox, "The number of characters/bytes that have either been sent or received to/from the COM port. These are raw values, i.e. can differ from the number of displayed characters if things like ANSI escape codes have been parsed.");

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



        //======================= TX ===================//
        totalRawCharCountTxLabel.setText(Integer.toString(terminal.stats.totalRawCharCountTx.getValue()));
        terminal.stats.totalRawCharCountTx.addListener((observable, oldValue, newValue) -> {
            // Convert new value into string and update label
            totalRawCharCountTxLabel.setText(Integer.toString(newValue.intValue()));
        });

        //======================= RX ===================//
        totalRawCharCountRxLabel.setText(Integer.toString(terminal.stats.totalRawCharCountRx.getValue()));
        terminal.stats.totalRawCharCountRx.addListener((observable, oldValue, newValue) -> {
            // Convert new value into string and update label
            totalRawCharCountRxLabel.setText(Integer.toString(newValue.intValue()));
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
