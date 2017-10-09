package ninja.mbedded.ninjaterm.model.terminal.txRx;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.scene.input.Clipboard;
import javafx.scene.input.DataFormat;
import javafx.scene.input.KeyEvent;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.model.terminal.txRx.colouriser.Colouriser;
import ninja.mbedded.ninjaterm.model.terminal.txRx.display.Display;
import ninja.mbedded.ninjaterm.model.terminal.txRx.filters.Filters;
import ninja.mbedded.ninjaterm.model.terminal.txRx.formatting.Formatting;
import ninja.mbedded.ninjaterm.model.terminal.txRx.macros.MacroManager;
import ninja.mbedded.ninjaterm.util.arrayUtils.ArrayUtils;
import ninja.mbedded.ninjaterm.util.debugging.Debugging;
import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import ninja.mbedded.ninjaterm.util.rxProcessing.rxDataEngine.RxDataEngine;
import ninja.mbedded.ninjaterm.util.rxProcessing.streamedData.StreamedData;
import org.slf4j.Logger;

import java.util.ArrayList;
import java.util.List;

/**
 * Model handling the TX/RX data of a terminal. This is displayed as a sub-tab of a terminal
 * tab in the GUI.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @last-modified 2017-10-08
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
    public Formatting formatting;
    public Colouriser colouriser = new Colouriser();
    public Filters filters = new Filters();
    public MacroManager macroManager;

    public ObservableList<Byte> toSendTxData = FXCollections.observableArrayList();

    public List<StreamedDataListener> txDataToDisplayListeners = new ArrayList<>();


    public List<DataSentTxListener> dataSentTxListeners = new ArrayList<>();

    public List<DataClearedListener> txDataClearedListeners = new ArrayList<>();
    public List<DataClearedListener> rxDataClearedListeners = new ArrayList<>();

    public RxDataEngine rxDataEngine = new RxDataEngine();

    private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    /**
     * Constructor.
     *
     * @param model    The root object of the model.
     * @param terminal The ancestor "terminal" model for this TxRx model.
     */
    public TxRx(Model model, Terminal terminal) {

        this.model = model;
        this.terminal = terminal;

        //====================================//
        //========= CHILD MODEL SETUP ========//
        //====================================//

        formatting = new Formatting(model, terminal);

        macroManager = new MacroManager(model, terminal);

        // Bind the enabled boolean for the time stamping to the RX engine
        rxDataEngine.isTimeStampParserEnabled.bindBidirectional(formatting.isTimeStampingEnabled);

        //====================================//
        //========= BUFFER-SIZE SETUP ========//
        //====================================//

        // Bind the RX data engine's buffer size to the value held in the
        // display class (the value in the display class will be updated by the
        // user)
        rxDataEngine.maxBufferSize.bind(display.bufferSizeChars);

        //====================================//
        //============ FILTER SETUP =========//
        //====================================//

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

    public void handleKeyPressed(KeyEvent keyEvent) {
        logger.debug("handleKeyPressed() called with keyEvent = " + keyEvent);

        if (terminal.comPort.isPortOpen() == false) {
            model.status.addErr("Cannot send data to COM port, port is not open.");
            return;
        }

        //==============================================//
        //============ LOOK FOR COPY/PASTE =============//
        //==============================================//

        // PASTE
        if (keyEvent.isControlDown() && keyEvent.getCharacter().equals("\u0016")) {
            logger.debug("Detected paste command.");

            if (!Clipboard.getSystemClipboard().hasContent(DataFormat.PLAIN_TEXT)) {
                model.status.addErr("Clipboard did not contain plain text. Can only paste plain text into TX.");
                return;
            }

            String contents = Clipboard.getSystemClipboard().getString();
            logger.debug("Clipboard contents = " + contents);

            terminal.txRx.addTxCharsToSend(contents.getBytes());

            if (terminal.txRx.formatting.selTxCharSendingOption.get() ==
                    Formatting.TxCharSendingOptions.SEND_TX_CHARS_IMMEDIATELY) {
                terminal.txRx.sendBufferedTxDataToSerialPort();
            }

            return;
        }


        //==============================================//
        //========= HANDLE STANDARD KEY PRESS ==========//
        //==============================================//

        char asciiCodeForKey = (char) keyEvent.getCharacter().charAt(0);

        // If to see if we are sending data on "enter", and the "backspace
        // deletes last typed char" checkbox is ticked, if so, remove last char rather than
        // treating this character as something to send.
        if ((formatting.selTxCharSendingOption.get() == Formatting.TxCharSendingOptions.SEND_TX_CHARS_ON_ENTER) &&
                display.backspaceRemovesLastTypedChar.get()) {

            if (asciiCodeForKey == '\b') {
                // We need to remove the last typed char from the "to send" TX buffer
                removeLastCharInTxBuffer();
                return;
            }
        }

        // Look for enter. If enter was pressed, we need to insert the right chars as
        // set by the user in the ("enter key behaviour" radio buttons).
        if (asciiCodeForKey == '\r') {
            logger.debug("Enter key was pressed.");

            switch (formatting.selEnterKeyBehaviour.get()) {
                case CARRIAGE_RETURN:
                    addTxCharsToSend(new byte[]{'\r'});
                    break;
                case NEW_LINE:
                    addTxCharsToSend(new byte[]{'\n'});
                    break;
                case CARRIAGE_RETURN_AND_NEW_LINE:
                    addTxCharsToSend(new byte[]{'\r', '\n'});
                    break;
                default:
                    throw new RuntimeException("selEnterKeyBehaviour was not recognised.");
            }
        } else {
            // Key pressed was NOT enter,
            // so append the character to the end of the "to send" TX buffer
            addTxCharsToSend(new byte[]{(byte) asciiCodeForKey});
        }

        // Check so see what TX mode we are in
        switch (formatting.selTxCharSendingOption.get()) {
            case SEND_TX_CHARS_IMMEDIATELY:
                sendBufferedTxDataToSerialPort();
                break;
            case SEND_TX_CHARS_ON_ENTER:
                // Check for enter key before sending data
                if ((asciiCodeForKey == '\r'))
                    sendBufferedTxDataToSerialPort();
                break;
            default:
                throw new RuntimeException("selTxCharSendingOption not recognised!");
        }
    }

    /**
     * Send any data that is in the TX buffer to the COM port.
     * <p>
     * This will return without sending if the COM port is not open.
     */
    public void sendBufferedTxDataToSerialPort() {

        if (terminal.comPort.isPortOpen() == false) {
            model.status.addErr("Cannot send data to COM port, port is not open.");
            return;
        }

        // Send data to COM port, and update stats (both local and global)
        byte[] dataAsByteArray = ArrayUtils.fromObservableListToByteArray(toSendTxData);
        terminal.comPort.sendData(dataAsByteArray);

        // Update stats
        terminal.stats.totalRawCharCountTx.setValue(terminal.stats.totalRawCharCountTx.getValue() + dataAsByteArray.length);
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
            addRxData(dataAsByteArray);
        }

        // Finally, update listeners
        for (DataSentTxListener dataSentTxListener : dataSentTxListeners) {
            dataSentTxListener.run(dataAsString);
        }
    }

    /**
     * Add a TX char to send to COM port. This DOES NOT send the data but rather only adds it to a buffer.
     *
     * @param data
     */
    public void addTxCharsToSend(byte[] data) {

        logger.debug("addTxCharsToSend() called with data = " + Debugging.toString(data));

        // Add the data to the "to send" TX buffer
        for (byte dataByte : data) {
            toSendTxData.add(dataByte);
        }

        // Add to TX data that the user sees displayed in UI
        String dataAsString = "";
        for (int i = 0; i < data.length; i++) {
            dataAsString = dataAsString + (char) data[i];
        }

        for (StreamedDataListener streamedDataListener : txDataToDisplayListeners) {
            StreamedData txStreamedData = new StreamedData();
            txStreamedData.append(dataAsString);
            streamedDataListener.run(txStreamedData);
        }

    }

    public void removeLastCharInTxBuffer() {

        if (toSendTxData.size() > 0) {
            // Remove the last char from both the "to send" TX buffer,
            // and the TX display string
            toSendTxData.remove(toSendTxData.size() - 1);
            //txDataToDisplay.set(txDataToDisplay.get().substring(0, txDataToDisplay.get().length() - 1));
            // TODO: 2016-11-16 Implement
        }
    }

    /**
     * Adds RX data to the RX pane (both the raw RX data and the filtered RX data, which is the
     * data which gets displayed to the user in the RX pane).
     * <p>
     * This also gets called with TX data if the "TX local echo" option is selected.
     *
     * @param data
     */
    public void addRxData(byte[] data) {
        logger.debug("addRxData() called with data = " + Debugging.toString(data));
        rxDataEngine.parse(data);
    }

    /**
     * Clears data from all internal buffers and emits an RxDataCleared event
     * for the UI.
     */
    public void clearTxAndRxData() {
        logger.debug("clearTxAndRxData() called.");

        // Clear all internal buffers
        rxDataEngine.clearAllData();

        // Emit RX data cleared event for the UI
        for (DataClearedListener rxDataClearedListener : rxDataClearedListeners) {
            rxDataClearedListener.run();
        }

        for (DataClearedListener txDataClearedListener : txDataClearedListeners) {
            txDataClearedListener.run();
        }

        model.status.addMsg("Terminal TX/RX text cleared.");
    }

    /**
     * Call this method to update the buffered RX data based on a new filter pattern.
     */
    private void updateBufferedRxDataWithNewFilterPattern() {
        // Emit RX data cleared event
        for (DataClearedListener rxDataClearedListener : rxDataClearedListeners) {
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
            for (DataClearedListener rxDataClearedListener : rxDataClearedListeners) {
                rxDataClearedListener.run();
            }

            // Now re-run filter. This will re-populate the RX data that the user sees
            rxDataEngine.rerunFilterOnExistingData();

        } // if(filters.filterApplyType.get() == Filters.FilterApplyTypes.APPLY_TO_BUFFERED_AND_NEW_RX_DATA)
    }

    public void freezeRx() {
        //isRxFrozenInternal.set(true);
        rxDataEngine.isFrozen.set(true);
        model.status.addMsg("RX data frozen.");
    }

    public void unFreezeRx() {
        //isRxFrozenInternal.set(false);
        rxDataEngine.isFrozen.set(false);
        model.status.addMsg("RX data un-frozen.");

        // Call this to release any streamed text which has been building up since the
        // RX data was frozen
        addRxData(new byte[]{});
    }

}
