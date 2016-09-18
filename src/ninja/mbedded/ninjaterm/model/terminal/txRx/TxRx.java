package ninja.mbedded.ninjaterm.model.terminal.txRx;

import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;
import ninja.mbedded.ninjaterm.model.terminal.txRx.layout.Layout;

/**
 * Created by gbmhu on 2016-09-16.
 */
public class TxRx {

    public Layout layout = new Layout();

    public SimpleStringProperty txRxText = new SimpleStringProperty();

    public void addRxData(String data) {
        txRxText.set(txRxText.get() + data);
    }

}
