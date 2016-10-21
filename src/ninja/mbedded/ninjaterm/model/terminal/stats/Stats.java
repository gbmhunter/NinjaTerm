package ninja.mbedded.ninjaterm.model.terminal.stats;

import javafx.animation.Animation;
import javafx.animation.KeyFrame;
import javafx.animation.Timeline;
import javafx.beans.property.SimpleDoubleProperty;
import javafx.beans.property.SimpleIntegerProperty;
import javafx.util.Duration;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;

/**
 * Model containing data and logic for statistics about a terminal (COM port).
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-16
 * @last-modified   2016-10-21
 */
public class Stats {

    //================================================================================================//
    //======================================== CLASS CONSTANTS =======================================//
    //================================================================================================//

    private static final double BYTES_PER_SECOND_CALC_PERIOD_MS = 1000.0;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    //==============================================//
    //========= NUM. CHARS IN BUFFER FIELDS ========//
    //==============================================//

    public SimpleIntegerProperty numCharsInTxBuffer = new SimpleIntegerProperty();
    public SimpleIntegerProperty numCharsInRxBuffer = new SimpleIntegerProperty();

    //==============================================//
    //=========== TOTAL CHAR COUNT FIELDS ==========//
    //==============================================//

    public SimpleIntegerProperty totalNumCharsTx = new SimpleIntegerProperty(0);
    public SimpleIntegerProperty totalNumCharsRx = new SimpleIntegerProperty(0);

    //==============================================//
    //=============== BYTES/SEC FIELDS =============//
    //==============================================//

    private double bytesSinceLastCalcRx = 0.0;
    private double bytesSinceLastCalcTx = 0.0;

    public SimpleDoubleProperty bytesPerSecondTx = new SimpleDoubleProperty(0.0);
    public SimpleDoubleProperty bytesPerSecondRx = new SimpleDoubleProperty(0.0);

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public Stats(Terminal terminal) {

        //==============================================//
        //========== NUM. CHARS IN BUFFER SETUP ========//
        //==============================================//

        terminal.txRx.txData.addListener((observable, oldValue, newValue) -> {
            numCharsInTxBuffer.set(newValue.length());
        });

        terminal.txRx.rxDataEngine.rawRxData.addListener((observable, oldValue, newValue) -> {
            numCharsInTxBuffer.set(newValue.length());
        });

        //==============================================//
        //================ BYTES/SEC SETUP =============//
        //==============================================//

        // INSTALL TX/RX DATA LISTENERS
        terminal.txRx.dataSentTxListeners.add(txData -> {
            bytesSinceLastCalcTx += txData.length();
        });

        terminal.txRx.rxDataEngine.rawDataReceivedListeners.add(data -> {
            bytesSinceLastCalcRx += data.length();
        });

        // Setup timer to trigger calculation of bits/second at a fixed rate
        Timeline timeline = new Timeline(new KeyFrame(
                Duration.millis(BYTES_PER_SECOND_CALC_PERIOD_MS),
                ae -> calculateBytesPerSecond()));
        timeline.setCycleCount(Animation.INDEFINITE);
        timeline.play();
    }

    /**
     * This should be called once every <code>BYTES_PER_SECOND_CALC_PERIOD_MS</code> by a Timeline object
     * setup in this classes constructor.
     */
    private void calculateBytesPerSecond() {

        bytesPerSecondTx.set(bytesSinceLastCalcTx / (BYTES_PER_SECOND_CALC_PERIOD_MS /1000.0));
        bytesSinceLastCalcTx = 0.0;

        bytesPerSecondRx.set(bytesSinceLastCalcRx / (BYTES_PER_SECOND_CALC_PERIOD_MS /1000.0));
        bytesSinceLastCalcRx = 0.0;
    }

}
