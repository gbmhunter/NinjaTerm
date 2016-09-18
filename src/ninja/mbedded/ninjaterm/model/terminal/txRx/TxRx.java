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

    public TxRx() {
        display.bufferSizeChars.addListener((observable, oldValue, newValue) -> {
            removeOldCharsFromBuffers();
        });
    }

    public void addTxData(String data) {

        txData.set(txData.get() + data);

        if(txData.get().length() > display.bufferSizeChars.get()) {
            // Truncate TX data, removing old characters
            txData.set(removeOldChars(txData.get(), display.bufferSizeChars.get()));
        }

        // Echo TX data into TX/RX pane
        if(display.localTxEcho.get()) {
            txRxData.set(txRxData.get() + data);


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
