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
 * @last-modified   2016-10-07
 */
public class Stats {

    private static final double BITS_PER_SECOND_CALC_PERIOD_MS = 1000.0;

    public SimpleIntegerProperty numCharactersTx = new SimpleIntegerProperty(0);
    public SimpleIntegerProperty numCharactersRx = new SimpleIntegerProperty(0);

    private double bitsSinceLastCalcRx = 0.0;
    private double bitsSinceLastCalcTx = 0.0;

    public SimpleDoubleProperty bitsPerSecondTx = new SimpleDoubleProperty(0.0);
    public SimpleDoubleProperty bitsPerSecondRx = new SimpleDoubleProperty(0.0);

    public Stats(Terminal terminal) {

        // INSTALL TX/RX DATA LISTENERS
        terminal.txRx.dataSentTxListeners.add(txData -> {
            bitsSinceLastCalcTx += txData.length();
        });

        terminal.txRx.rawDataReceivedListeners.add(data -> {
            bitsSinceLastCalcRx += data.length();
        });

        // Setup timer to trigger calculation of bits/second at a fixed rate
        Timeline timeline = new Timeline(new KeyFrame(
                Duration.millis(BITS_PER_SECOND_CALC_PERIOD_MS),
                ae -> recalculateBitsPerSecond()));
        timeline.setCycleCount(Animation.INDEFINITE);
        timeline.play();
    }

    /**
     * This should be called once every <code>BITS_PER_SECOND_CALC_PERIOD_MS</code>.
     */
    private void recalculateBitsPerSecond() {

        bitsPerSecondTx.set(bitsSinceLastCalcTx/ (BITS_PER_SECOND_CALC_PERIOD_MS/1000.0));
        bitsSinceLastCalcTx = 0.0;

        bitsPerSecondRx.set(bitsSinceLastCalcRx/ (BITS_PER_SECOND_CALC_PERIOD_MS/1000.0));
        bitsSinceLastCalcRx = 0.0;
    }

}
