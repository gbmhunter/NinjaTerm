package ninja.mbedded.ninjaterm.model.terminal.txRx;

import javafx.beans.property.SimpleStringProperty;
import ninja.mbedded.ninjaterm.model.terminal.txRx.layout.Layout;

/**
 * Created by gbmhu on 2016-09-16.
 */
public class TxRx {

    public Layout layout = new Layout();


    public SimpleStringProperty txData = new SimpleStringProperty("");

    /**
     * Initialise with "" so that it does not display "null".
     */
    public SimpleStringProperty txRxData = new SimpleStringProperty("");

    public void addTxData(String data) {

        txData.set(txData.get() + data);

        // Echo TX data into TX/RX pane
        if(layout.localTxEcho.get()) {
            txRxData.set(txRxData.get() + data);
        }

    }

    public void addRxData(String data) {
        txRxData.set(txRxData.get() + data);
    }



}
