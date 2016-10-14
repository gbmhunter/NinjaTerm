package ninja.mbedded.ninjaterm.model.status;

import javafx.animation.Animation;
import javafx.animation.KeyFrame;
import javafx.animation.Timeline;
import javafx.beans.property.SimpleDoubleProperty;
import javafx.beans.property.SimpleIntegerProperty;
import javafx.collections.FXCollections;
import javafx.collections.ListChangeListener;
import javafx.collections.ObservableList;
import javafx.scene.Node;
import javafx.scene.paint.Color;
import javafx.scene.text.Text;
import javafx.util.Duration;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.model.terminal.txRx.DataSentTxListener;
import ninja.mbedded.ninjaterm.model.terminal.txRx.RawDataReceivedListener;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;

/**
 * Model containing data and logic for NinjaTerm status messages.
 *
 * These are displayed at the bottom of the application in the status bar.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-18
 * @last-modified   2016-10-07
 */
public class Status {

    private static final double BITS_PER_SECOND_CALC_PERIOD_MS = 1000.0;

    private Model model;

    public ObservableList<Node> statusMsgs = FXCollections.observableList(new ArrayList<Node>());

    public SimpleIntegerProperty totalByteCountTx = new SimpleIntegerProperty(0);
    public SimpleIntegerProperty totalByteCountRx = new SimpleIntegerProperty(0);

    public SimpleDoubleProperty totalBytesPerSecTx = new SimpleDoubleProperty();
    public SimpleDoubleProperty totalBytesPerSecRx = new SimpleDoubleProperty();

    public Status(Model model) {

        this.model = model;

        //==============================================//
        //=========== TOTAL BYTE COUNT SETUP ===========//
        //==============================================//

        DataSentTxListener dataSentTxListener = txData -> {
            totalByteCountTx.set(totalByteCountTx.get() + txData.length());
        };

        RawDataReceivedListener rawDataReceivedListener = data -> {
            totalByteCountRx.set(totalByteCountRx.get() + data.length());
        };

        // Add listener to the list of terminals. Whenever a terminal object is added or removed,
        // update the listeners that increments the total byte counts appropriately.
        model.terminals.addListener((ListChangeListener.Change<? extends Terminal> change) -> {
            while (change.next()) {

                if(change.wasReplaced() || change.wasPermutated()) {
                    throw new RuntimeException("The type of modification on the model.terminals observable list was not supported.");
                }

                for(Terminal terminal : change.getAddedSubList()) {
                    terminal.txRx.dataSentTxListeners.add(dataSentTxListener);
                    terminal.txRx.rxDataEngine.rawDataReceivedListeners.add(rawDataReceivedListener);
                }

                for(Terminal terminal : change.getRemoved()) {
                    terminal.txRx.dataSentTxListeners.remove(dataSentTxListener);
                    terminal.txRx.rxDataEngine.rawDataReceivedListeners.remove(rawDataReceivedListener);
                }
            }
        });

        // Setup timer to trigger calculation of bits/second at a fixed rate
        Timeline timeline = new Timeline(new KeyFrame(
                Duration.millis(BITS_PER_SECOND_CALC_PERIOD_MS),
                ae -> calculateBytesPerSec()));
        timeline.setCycleCount(Animation.INDEFINITE);
        timeline.play();

    }

    /**
     * This should be called once every <code>BITS_PER_SECOND_CALC_PERIOD_MS</code>.
     */
    private void calculateBytesPerSec() {

        double bytesPerSecondSumTx = 0.0;
        double bytesPerSecondSumRx = 0.0;

        for(Terminal terminal : model.terminals) {
            bytesPerSecondSumTx += terminal.stats.bytesPerSecondTx.get();
            bytesPerSecondSumRx += terminal.stats.bytesPerSecondRx.get();
        }

        totalBytesPerSecTx.set(bytesPerSecondSumTx);
        totalBytesPerSecRx.set(bytesPerSecondSumRx);
    }

    /**
     * Prints the given message to the status window. This prepends the current date/time to the massage
     * as well as adding a carriage return and new-line character to the end of the message.
     * @param msg   The message you want to print.
     */
    public void addMsg(String msg) {

        // Build up a string of the current date/time (incl. milli-seconds)
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS");
        Date date = new Date();
        String dateString = sdf.format(date);

        //statusTextFlow.getChildren().add(new Text(dateString + ": " + msg + "\r\n"));
        statusMsgs.add(new Text(dateString + ": " + msg + "\r\n"));
    }

    /**
     * Prints the given error message to the status window. This prepends the current date/time to the massage
     * as well as adding a carriage return and new-line character to the end of the message.
     * @param msg   The error message you want to print.
     */
    public void addErr(String msg) {

        // Build up a string of the current date/time (incl. milli-seconds)
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS");
        Date date = new Date();
        String dateString = sdf.format(date);

        Text text = new Text(dateString + ": ERROR. " + msg + "\r\n");
        text.setFill(Color.RED);
        //statusTextFlow.getChildren().add(text);
        statusMsgs.add(text);
    }

}
