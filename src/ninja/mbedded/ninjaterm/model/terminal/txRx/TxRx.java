package ninja.mbedded.ninjaterm.model.terminal.txRx;

import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import ninja.mbedded.ninjaterm.interfaces.AppendedStringData;
import ninja.mbedded.ninjaterm.model.terminal.txRx.display.Display;
import ninja.mbedded.ninjaterm.model.terminal.txRx.filters.Filters;
import ninja.mbedded.ninjaterm.util.stringFilter.StringFilter;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by gbmhu on 2016-09-16.
 */
public class TxRx {

    public Display display = new Display();
    public Filters filters = new Filters();

    public ObservableList<Byte> toSendTxData = FXCollections.observableArrayList();
    public SimpleStringProperty txData = new SimpleStringProperty("");

    /**
     * Initialise with "" so that it does not display "null".
     */
    public SimpleStringProperty rxData = new SimpleStringProperty("");

    /**
     * RX data which has been filtered according to the filter text.
     */
    public SimpleStringProperty filteredRxData = new SimpleStringProperty("");

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

    public void removeLastCharInTxBuffer() {

        if(toSendTxData.size() > 0) {
            // Remove the last char from both the "to send" TX buffer,
            // and the TX display string
            toSendTxData.remove(toSendTxData.size() - 1);
            txData.set(txData.get().substring(0, txData.get().length() - 1));
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
            rxData.set(rxData.get() + dataAsString);

            if(rxData.get().length() > display.bufferSizeChars.get()) {
                // Remove old characters from buffer
                rxData.set(removeOldChars(rxData.get(), display.bufferSizeChars.get()));
            }
        }
    }

    //List<AppendedStringData> appendedStringDataListeners = new ArrayList<>();

    public void addRxData(String data) {
        rxData.set(rxData.get() + data);

        // Truncate if necessary
        if(rxData.get().length() > display.bufferSizeChars.get()) {
            // Remove old characters from buffer
            rxData.set(removeOldChars(rxData.get(), display.bufferSizeChars.get()));
        }

        if(filters.filterText.get().equals("")) {
            filteredRxData.set(rxData.get());
        } else {
            filteredRxData.set(StringFilter.filterByLine(rxData.get(), filters.filterText.get()));
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

        if(rxData.get().length() > display.bufferSizeChars.get()) {
            // Remove old characters from buffer
            rxData.set(removeOldChars(rxData.get(), display.bufferSizeChars.get()));
        }
    }

}
