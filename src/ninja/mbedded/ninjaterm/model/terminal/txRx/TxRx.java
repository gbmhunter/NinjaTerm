package ninja.mbedded.ninjaterm.model.terminal.txRx;

import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import ninja.mbedded.ninjaterm.model.terminal.txRx.display.Display;

/**
 * Created by gbmhu on 2016-09-16.
 */
public class TxRx {

    public Display display = new Display();

    public ObservableList<Byte> toSendTxData = FXCollections.observableArrayList();
    public SimpleStringProperty txData = new SimpleStringProperty("");

    /**
     * Initialise with "" so that it does not display "null".
     */
    public SimpleStringProperty txRxData = new SimpleStringProperty("");

    public TxRx() {
        display.bufferSizeChars.addListener((observable, oldValue, newValue) -> {
            removeOldCharsFromBuffers();
        });
    }

    public void addTxCharToSend(byte data) {
        // Create string from data
        /*String dataAsString = "";
        for(int i = 0; i < data.length; i++) {
            dataAsString = dataAsString + (char)data[i];
        }*/

        txData.set(txData.get() + (char)data);
        toSendTxData.add(data);

        if(txData.get().length() > display.bufferSizeChars.get()) {
            // Truncate TX data, removing old characters
            txData.set(removeOldChars(txData.get(), display.bufferSizeChars.get()));
        }

    }

    public void txDataSent() {

        // Create string from data
        String dataAsString = "";
        for(int i = 0; i < toSendTxData.size(); i++) {
            dataAsString = dataAsString + (char)toSendTxData.get(i).byteValue();
        }

        // Clean "to send" TX data
        toSendTxData.clear();

        // Echo TX data into TX/RX pane
        if(display.localTxEcho.get()) {
            txRxData.set(txRxData.get() + dataAsString);

            if(txRxData.get().length() > display.bufferSizeChars.get()) {
                // Remove old characters from buffer
                txRxData.set(removeOldChars(txRxData.get(), display.bufferSizeChars.get()));
            }
        }
    }

    public void addRxData(String data) {
        txRxData.set(txRxData.get() + data);

        if(txRxData.get().length() > display.bufferSizeChars.get()) {
            // Remove old characters from buffer
            txRxData.set(removeOldChars(txRxData.get(), display.bufferSizeChars.get()));
        }
    }

    public String removeOldChars(String data, int desiredLength) {
        return data.substring(data.length() - desiredLength, data.length());
    }

    public void removeOldCharsFromBuffers() {

        if(txData.get().length() > display.bufferSizeChars.get()) {
            // Truncate TX data, removing old characters
            txData.set(removeOldChars(txData.get(), display.bufferSizeChars.get()));
        }

        if(txRxData.get().length() > display.bufferSizeChars.get()) {
            // Remove old characters from buffer
            txRxData.set(removeOldChars(txRxData.get(), display.bufferSizeChars.get()));
        }
    }

}
