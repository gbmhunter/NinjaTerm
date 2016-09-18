package ninja.mbedded.ninjaterm.model.terminal.txRx;

import javafx.beans.property.SimpleStringProperty;
import ninja.mbedded.ninjaterm.model.terminal.txRx.display.Display;

/**
 * Created by gbmhu on 2016-09-16.
 */
public class TxRx {

    public Display display = new Display();


    public SimpleStringProperty txData = new SimpleStringProperty("");

    /**
     * Initialise with "" so that it does not display "null".
     */
    public SimpleStringProperty txRxData = new SimpleStringProperty("");

    public void addTxData(String data) {

        txData.set(txData.get() + data);

        // Echo TX data into TX/RX pane
        if(display.localTxEcho.get()) {
            txRxData.set(txRxData.get() + data);
        }

    }

    public void addRxData(String data) {
        txRxData.set(txRxData.get() + data);
    }



}
