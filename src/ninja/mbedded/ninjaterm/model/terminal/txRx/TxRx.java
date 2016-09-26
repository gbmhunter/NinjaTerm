package ninja.mbedded.ninjaterm.model.terminal.txRx;

import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import ninja.mbedded.ninjaterm.interfaces.DataReceivedAsStringListener;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.model.terminal.txRx.display.Display;
import ninja.mbedded.ninjaterm.model.terminal.txRx.filters.Filters;
import ninja.mbedded.ninjaterm.model.terminal.txRx.formatting.Formatting;
import ninja.mbedded.ninjaterm.util.comport.ComPort;
import ninja.mbedded.ninjaterm.util.stringFilter.StringFilter;

import java.util.ArrayList;
import java.util.List;

/**
 * Model handling the TX/RX data of a terminal. This is displayed as a sub-tab of a terminal
 * tab in the GUI.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-16
 * @last-modified   2016-09-23
 */
public class TxRx {

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    private Model model;
    private Terminal terminal;

    public Display display = new Display();
    public Formatting formatting = new Formatting();
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

    public List<DataReceivedAsStringListener> dataReceivedAsStringListeners = new ArrayList<>();

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public TxRx(Model model, Terminal terminal) {

        this.model = model;
        this.terminal = terminal;

        display.bufferSizeChars.addListener((observable, oldValue, newValue) -> {
            removeOldCharsFromBuffers();
        });
    }

    public void handleKeyPressed(byte asciiCodeForKey) {
        if(terminal.comPort.isPortOpen() == false) {
            model.status.addErr("Cannot send data to COM port, port is not open.");
            return;
        }

        // If to see if we are sending data on "enter", and the "backspace
        // deletes last typed char" checkbox is ticked
        if((terminal.txRx.display.selTxCharSendingOption.get() == Display.TxCharSendingOptions.SEND_TX_CHARS_ON_ENTER) &&
                terminal.txRx.display.backspaceRemovesLastTypedChar.get()) {

            if((char)asciiCodeForKey == '\b') {
                // We need to remove the last typed char from the "to send" TX buffer
                terminal.txRx.removeLastCharInTxBuffer();
                return;
            }

        }

        // Append the character to the end of the "to send" TX buffer
        terminal.txRx.addTxCharToSend(asciiCodeForKey);

        // Check so see what TX mode we are in
        switch(terminal.txRx.display.selTxCharSendingOption.get()) {
            case SEND_TX_CHARS_IMMEDIATELY:
                break;
            case SEND_TX_CHARS_ON_ENTER:
                // Check for enter key before sending data
                if(!((char)asciiCodeForKey == '\r'))
                    return;
                break;
            default:
                throw new RuntimeException("selTxCharSendingOption not recognised!");
        }

        // Send data to COM port, and update stats (both local and global)
        byte[] dataAsByteArray = fromObservableListToByteArray(terminal.txRx.toSendTxData);
        terminal.comPort.sendData(dataAsByteArray);

        terminal.stats.numCharactersTx.setValue(terminal.stats.numCharactersTx.getValue() + dataAsByteArray.length);
        model.globalStats.numCharactersTx.setValue(model.globalStats.numCharactersTx.getValue() + dataAsByteArray.length);

        terminal.txRx.txDataSent();
    }

    private byte[] fromObservableListToByteArray(ObservableList<Byte> observableList) {

        byte[] data = new byte[observableList.size()];
        int i = 0;
        for(Byte singleByte : observableList) {
            data[i++] = singleByte;
        }

        return data;
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

        // Finally, call any listeners (the logging class of the model might be listening)
        for(DataReceivedAsStringListener dataReceivedAsStringListener : dataReceivedAsStringListeners) {
            dataReceivedAsStringListener.update(data);
        }
    }

    /**
     * Trims a string to the provided number of characters. Removes characters from the start of the string
     * (the "old" chars).
     * @param data
     * @param desiredLength
     * @return  The trimmed string.
     */
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
