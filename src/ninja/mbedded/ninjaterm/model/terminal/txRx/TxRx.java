package ninja.mbedded.ninjaterm.model.terminal.txRx;

import javafx.beans.property.SimpleBooleanProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.model.terminal.txRx.colouriser.Colouriser;
import ninja.mbedded.ninjaterm.model.terminal.txRx.display.Display;
import ninja.mbedded.ninjaterm.model.terminal.txRx.filters.Filters;
import ninja.mbedded.ninjaterm.model.terminal.txRx.formatting.Formatting;
import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import ninja.mbedded.ninjaterm.util.rxDataEngine.RxDataEngine;
import ninja.mbedded.ninjaterm.util.stringUtils.StringUtils;
import org.slf4j.Logger;

import java.util.ArrayList;
import java.util.List;

/**
 * Model handling the TX/RX data of a terminal. This is displayed as a sub-tab of a terminal
 * tab in the GUI.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @last-modified 2016-10-11
 * @since 2016-09-16
 */
public class TxRx {

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    // ANCESTOR MODELS
    private Model model;
    private Terminal terminal;

    // CHILD MODELS
    public Display display = new Display();
    public Formatting formatting = new Formatting();
    public Colouriser colouriser = new Colouriser();
    public Filters filters = new Filters();

    public ObservableList<Byte> toSendTxData = FXCollections.observableArrayList();
    public SimpleStringProperty txData = new SimpleStringProperty("");



    public List<DataSentTxListener> dataSentTxListeners = new ArrayList<>();

    public List<RxDataClearedListener> rxDataClearedListeners = new ArrayList<>();

    public RxDataEngine rxDataEngine = new RxDataEngine();

    private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public TxRx(Model model, Terminal terminal) {

        this.model = model;
        this.terminal = terminal;

        display.bufferSizeChars.addListener((observable, oldValue, newValue) -> {
            removeOldCharsFromBuffers();
        });

        filters.filterApplyType.addListener((observable, oldValue, newValue) -> {
            if (newValue == Filters.FilterApplyTypes.APPLY_TO_BUFFERED_AND_NEW_RX_DATA) {
                updateBufferedRxDataWithNewFilterPattern();
            }
        });

        filters.filterText.addListener((observable, oldValue, newValue) -> {
            filterTextChanged(newValue);
        });

        colouriser.init(model, terminal);


    }

    public void handleKeyPressed(byte asciiCodeForKey) {
        logger.debug("handleKeyPressed() called.");
        if (terminal.comPort.isPortOpen() == false) {
            model.status.addErr("Cannot send data to COM port, port is not open.");
            return;
        }

        // If to see if we are sending data on "enter", and the "backspace
        // deletes last typed char" checkbox is ticked, if so, remove last char rather than
        // treating this character as something to send.
        if ((display.selTxCharSendingOption.get() == Display.TxCharSendingOptions.SEND_TX_CHARS_ON_ENTER) &&
                display.backspaceRemovesLastTypedChar.get()) {

            if ((char) asciiCodeForKey == '\b') {
                // We need to remove the last typed char from the "to send" TX buffer
                removeLastCharInTxBuffer();
                return;
            }
        }

        // Look for enter. If enter was pressed, we need to insert the right chars as
        // set by the user in the ("enter key behaviour" radio buttons).
        if ((char) asciiCodeForKey == '\r') {
            logger.debug("Enter key was pressed.");

            switch (formatting.selEnterKeyBehaviour.get()) {
                case CARRIAGE_RETURN:
                    addTxCharToSend((byte) '\r');
                    break;
                case NEW_LINE:
                    addTxCharToSend((byte) '\n');
                    break;
                case CARRIAGE_RETURN_AND_NEW_LINE:
                    addTxCharToSend((byte) '\r');
                    addTxCharToSend((byte) '\n');
                    break;
                default:
                    throw new RuntimeException("selEnterKeyBehaviour was not recognised.");
            }
        } else {
            // Key pressed was NOT enter,
            // so append the character to the end of the "to send" TX buffer
            addTxCharToSend(asciiCodeForKey);
        }

        // Check so see what TX mode we are in
        switch (display.selTxCharSendingOption.get()) {
            case SEND_TX_CHARS_IMMEDIATELY:
                sendBufferedTxDataToSerialPort();
                break;
            case SEND_TX_CHARS_ON_ENTER:
                // Check for enter key before sending data
                if (((char) asciiCodeForKey == '\r'))
                    sendBufferedTxDataToSerialPort();
                break;
            default:
                throw new RuntimeException("selTxCharSendingOption not recognised!");
        }
    }

    private void sendBufferedTxDataToSerialPort() {
        // Send data to COM port, and update stats (both local and global)
        byte[] dataAsByteArray = fromObservableListToByteArray(toSendTxData);
        terminal.comPort.sendData(dataAsByteArray);

        // Update stats
        terminal.stats.numCharactersTx.setValue(terminal.stats.numCharactersTx.getValue() + dataAsByteArray.length);
        model.globalStats.numCharactersTx.setValue(model.globalStats.numCharactersTx.getValue() + dataAsByteArray.length);

        // Create string from data
        String dataAsString = "";
        for (int i = 0; i < toSendTxData.size(); i++) {
            dataAsString = dataAsString + (char) toSendTxData.get(i).byteValue();
        }

        // Clean "to send" TX data
        toSendTxData.clear();

        // Echo TX data into TX/RX pane if user has instructed to do so
        if (display.localTxEcho.get()) {

            // Call the RX data function (this function doesn't know the difference between actual RX data
            // and echoed TX data)
            addRxData(dataAsString);
        }

        // Finally, update listeners
        for (DataSentTxListener dataSentTxListener : dataSentTxListeners) {
            dataSentTxListener.run(dataAsString);
        }
    }

    private byte[] fromObservableListToByteArray(ObservableList<Byte> observableList) {

        byte[] data = new byte[observableList.size()];
        int i = 0;
        for (Byte singleByte : observableList) {
            data[i++] = singleByte;
        }

        return data;
    }

    /**
     * Add a TX char to send to COM port. This DOES NOT send the data but rather only adds it to a buffer.
     *
     * @param data
     */
    public void addTxCharToSend(byte data) {

        System.out.printf(getClass().getName() + ".addTxCharToSend() called with data = 0x%02X\r\n", data);

        // Create string from data
        /*String dataAsString = "";
        for(int i = 0; i < data.length; i++) {
            dataAsString = dataAsString + (char)data[i];
        }*/

        txData.set(txData.get() + (char) data);
        toSendTxData.add(data);

        if (txData.get().length() > display.bufferSizeChars.get()) {
            // Truncate TX data, removing old characters
            txData.set(StringUtils.removeOldChars(txData.get(), display.bufferSizeChars.get()));
        }

    }

    public void removeLastCharInTxBuffer() {

        if (toSendTxData.size() > 0) {
            // Remove the last char from both the "to send" TX buffer,
            // and the TX display string
            toSendTxData.remove(toSendTxData.size() - 1);
            txData.set(txData.get().substring(0, txData.get().length() - 1));
        }
    }

    /**
     * Adds RX data to the RX pane (both the raw RX data and the filtered RX data, which is the
     * data which gets displayed to the user in the RX pane).
     * <p>
     * This also gets called with TX data if the "TX local echo" option is selected.
     * <p>
     *     1. Receive RX data as string
     *     2. Pass through ANSI escape code parser. Escape code parser may hold back certain characters.
     *     3. Pass through ASCII control code parser. This finds all ASCII control codes, and either converts
     *          them to their visible unicode symbol equivalent, or removes them. It also inserts records into
 *              ascii
     * </p>
     *
     * @param data
     */
    public void addRxData(String data) {

        rxDataEngine.parse(data);

    }



    public void removeOldCharsFromBuffers() {

        if (txData.get().length() > display.bufferSizeChars.get()) {
            // Truncate TX data, removing old characters
            txData.set(StringUtils.removeOldChars(txData.get(), display.bufferSizeChars.get()));
        }

        if (rxDataEngine.rawRxData.get().length() > display.bufferSizeChars.get()) {
            // Remove old characters from buffer
            rxDataEngine.rawRxData.set(StringUtils.removeOldChars(rxDataEngine.rawRxData.get(), display.bufferSizeChars.get()));
        }
    }

    /**
     * Call this if you want to clear TX/RX data from the UI.
     */
    public void clearTxAndRxData() {
        logger.debug("clearTxAndRxData() called.");

        // Emit RX data cleared event
        for (RxDataClearedListener rxDataClearedListener : rxDataClearedListeners) {
            rxDataClearedListener.run();
        }
    }

    /**
     * Call this method to update the buffered RX data based on a new filter pattern.
     */
    private void updateBufferedRxDataWithNewFilterPattern() {
        // Emit RX data cleared event
        for (RxDataClearedListener rxDataClearedListener : rxDataClearedListeners) {
            rxDataClearedListener.run();
        }
    }

    /**
     * This needs to be called when the filter text is changed so that everything is updated
     * accordingly.
     *
     * @param filterText
     */
    private void filterTextChanged(String filterText) {

        logger.debug("filterTextChanged() called.");

        rxDataEngine.setFilterPattern(filterText);

        if (filters.filterApplyType.get() == Filters.FilterApplyTypes.APPLY_TO_BUFFERED_AND_NEW_RX_DATA) {

            // Firstly, clear RX data on UI
            clearTxAndRxData();
            rxDataEngine.rerunFilterOnExistingData();
        } // if(filters.filterApplyType.get() == Filters.FilterApplyTypes.APPLY_TO_BUFFERED_AND_NEW_RX_DATA)
    }

    public void freezeRx() {
        //isRxFrozenInternal.set(true);
        ((SimpleBooleanProperty) rxDataEngine.isRxFrozen).set(true);
        model.status.addMsg("RX data frozen.");
    }

    public void unFreezeRx() {
        //isRxFrozenInternal.set(false);
        ((SimpleBooleanProperty) rxDataEngine.isRxFrozen).set(false);
        model.status.addMsg("RX data un-frozen.");

        // Call this to release any streamed text which has been building up since the
        // RX data was frozen
        addRxData("");
    }

}
