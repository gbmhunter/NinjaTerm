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
 * <p>
 * This class does not concern itself with any global stats, but just those
 * of single terminal instance (COM port).
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @last-modified 2016-11-22
 * @since 2016-09-16
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
    //==== NUM. CHARS IN DISPLAY BUFFER FIELDS =====//
    //==============================================//

    public SimpleIntegerProperty numCharsInTxDisplayBuffer = new SimpleIntegerProperty();
    public SimpleIntegerProperty numCharsInRxDisplayBuffer = new SimpleIntegerProperty();

    //==============================================//
    //========== TOTAL RAW CHAR COUNT SETUP ========//
    //==============================================//

    public SimpleIntegerProperty totalRawCharCountTx = new SimpleIntegerProperty(0);
    public SimpleIntegerProperty totalRawCharCountRx = new SimpleIntegerProperty(0);

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
        //===== NUM. CHARS IN DISPLAY BUFFER SETUP =====//
        //==============================================//

        // NOTE: These stats are "pushed" to this stat model
        // rather than "pulled", as the values are calculated
        // in the view

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

        bytesPerSecondTx.set(bytesSinceLastCalcTx / (BYTES_PER_SECOND_CALC_PERIOD_MS / 1000.0));
        bytesSinceLastCalcTx = 0.0;

        bytesPerSecondRx.set(bytesSinceLastCalcRx / (BYTES_PER_SECOND_CALC_PERIOD_MS / 1000.0));
        bytesSinceLastCalcRx = 0.0;
    }

}
