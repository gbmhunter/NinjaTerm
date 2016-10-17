package ninja.mbedded.ninjaterm.util.rxProcessing.rxDataEngine;

import javafx.beans.binding.Bindings;
import javafx.beans.property.ReadOnlyBooleanProperty;
import javafx.beans.property.ReadOnlyBooleanWrapper;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;
import ninja.mbedded.ninjaterm.model.terminal.txRx.RawDataReceivedListener;
import ninja.mbedded.ninjaterm.model.terminal.txRx.StreamedTextListener;
import ninja.mbedded.ninjaterm.util.rxProcessing.Decoding.Decoder;
import ninja.mbedded.ninjaterm.util.rxProcessing.Decoding.DecodingOptions;
import ninja.mbedded.ninjaterm.util.rxProcessing.ansiECParser.AnsiECParser;
import ninja.mbedded.ninjaterm.util.rxProcessing.asciiControlCharParser.AsciiControlCharParser;
import ninja.mbedded.ninjaterm.util.debugging.Debugging;
import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import ninja.mbedded.ninjaterm.util.rxProcessing.newLineParser.NewLineParser;
import ninja.mbedded.ninjaterm.util.rxProcessing.streamedText.StreamedData;
import ninja.mbedded.ninjaterm.util.rxProcessing.streamingFilter.StreamingFilter;
import ninja.mbedded.ninjaterm.util.stringUtils.StringUtils;
import org.slf4j.Logger;

import java.util.ArrayList;
import java.util.List;

/**
 * The entire RX data processing engine, encapsulated in a single class.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-10-14
 * @last-modified 2016-10-17
 */
public class RxDataEngine {

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    private Decoder decoder = new Decoder();

    public SimpleObjectProperty<DecodingOptions> selDecodingOption = new SimpleObjectProperty<>(DecodingOptions.ASCII);

    /**
     * Initialise with "" so that it does not display "null".
     */
    public SimpleStringProperty rawRxData = new SimpleStringProperty("");

    private AnsiECParser ansiECParser = new AnsiECParser();

    /**
     * This variable contains the backlog of data which is frozen. When the user
     * unfreezes the data again, all of this will be released to <code>totalNewLineParserOutput</code>
     * and to <code>bufferBetweenAnsiParserAndNewLineParser</code>.
     */
    private StreamedData frozenAnsiParserOutput = new StreamedData();

    private StreamedData bufferBetweenAnsiParserAndNewLineParser = new StreamedData();

    private NewLineParser newLineParser = new NewLineParser("\n");

    private StreamedData bufferBetweenNewLineParserAndFiltering = new StreamedData();

    /**
     * Used to provide filtering functionality to the RX data.
     */
    private StreamingFilter streamingFilter = new StreamingFilter();

    /**
     * Buffer to hold the streamed text which is output from the filter and
     * consumed by the <code>asciiControlCharParser</code>.
     */
    public StreamedData bufferBetweenFilterAndControlCharParser = new StreamedData();

    private AsciiControlCharParser asciiControlCharParser = new AsciiControlCharParser();

    /**
     * This is a buffer for the output of the ANSI parser. This is for when the filter text
     * is changed, and the user wishes to re-run the filter over data stored in the buffer.
     *
     * This only contains data which has been unfrozen. All frozen data will remain in
     * <code>frozenAnsiParserOutput</code> until data is unfrozen again
     */
    public StreamedData totalNewLineParserOutput = new StreamedData();



    public List<RawDataReceivedListener> rawDataReceivedListeners = new ArrayList<>();

    /**
     * This event is emitted every time the ANSI parser is run. The output of the ANSI
     * parser is passed along with the event.
     */
//    public List<StreamedTextListener> ansiParserOutputListeners = new ArrayList<>();

    /**
     * This event is emitted when new streamed output is available. This is what the
     * RX pane in the UI should be listening for.
     */
    public List<StreamedTextListener> newOutputListeners = new ArrayList<>();

    public ReadOnlyBooleanProperty isRxFrozen = new ReadOnlyBooleanWrapper();

    public int bufferSize = 20000;



    private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public RxDataEngine() {
        // Bind the selDeocdingOption variable to the copy inside the Decoder object
        // (selDecodingOption exposes the field inside the Decoder object)
        Bindings.bindBidirectional(selDecodingOption, decoder.decodingOption);

        // If the selected decoding option is changed, we also need to
        // change the behaviour of the ASCII control char parser
        selDecodingOption.addListener((observable, oldValue, newValue) -> {
            if(newValue == DecodingOptions.ASCII_WITH_CONTROL_CHARS) {
                asciiControlCharParser.replaceWithVisibleSymbols.set(true);
            } else if(newValue == DecodingOptions.ASCII) {
                asciiControlCharParser.replaceWithVisibleSymbols.set(false);
            }
        });
    }

    /**
     *
     *  <p>
     *     1. Receive RX data as pure string
     *     2. Pass through ANSI escape code parser. Escape code parser may hold back certain characters. This takes
     *              in a string put outs a StreamedData object. It populates the textColours array with objects that
     *              what colour and where colour changes occur.
     *     3. Pass through new line detecter. This does not modify the textual data, but populates the
     *              <code>newLineMarkers</code> array with entries and where new lines are to be inserted. This may
     *              hold back data if a partial new line is detected.
     *     3. Pass through ASCII control code parser. This finds all ASCII control codes, and either converts
     *              them to their visible unicode symbol equivalent, or removes them.
     *     4. Pass through filter. Filter only releases lines of text which match the provided pattern. Filter
     *              may hold back text which contains a partial match.
     *     5. The resulting StreamedData object is outputted to any listeners (the RX pane on the GUI should be
     *              listening to this).
     * </p>
     *
     * @param rxData    The received data from the COM port to process.
     */
    public void parse(byte[] rxData) {
        /*logger.debug(getClass().getSimpleName() + ".addRxData() called with data = \"" + Debugging.convertNonPrintable(data) + "\".");*/

        //==============================================//
        //==================== DECODER =================//
        //==============================================//

        String data = decoder.parse(rxData);

        rawRxData.set(rawRxData.get() + data);

        // Truncate if necessary
        if (rawRxData.get().length() > bufferSize) {
            // Remove old characters from buffer
            rawRxData.set(StringUtils.removeOldChars(rawRxData.get(), bufferSize));

        }

        //==============================================//
        //============== ANSI ESCAPE CODES =============//
        //==============================================//

        // This temporary streamed text object is just to hold NEW output
        // from the ANSI parser, before being combined with the existing data
        StreamedData releasedText = new StreamedData();
        ansiECParser.parse(data, releasedText);

        logger.debug("releasedText = " + Debugging.convertNonPrintable(releasedText.toString()));

        /*frozenAnsiParserOutput.shiftDataIn(releasedText, releasedText.getText().length());
        if(isRxFrozen.get()) {
            return;
        }*/

        // Fire ansiParserOutput event
        /*for (StreamedTextListener streamedTextListener : ansiParserOutputListeners) {
            // Create a new copy of the streamed text so that the listeners can't modify
            // the contents by mistake
            StreamedData streamedText = new StreamedData(frozenAnsiParserOutput);
            streamedTextListener.run(streamedText);
        }*/

        // Now add all the new ANSI parser output to any that was not used up by the
        // streaming filter from last time
        bufferBetweenAnsiParserAndNewLineParser.shiftDataIn(releasedText, releasedText.getText().length());

        //frozenAnsiParserOutput.clear();

        logger.debug("Finished adding data to buffer between ANSI parser and filter. bufferBetweenAnsiParserAndNewLineParser = " + bufferBetweenAnsiParserAndNewLineParser);

        //==============================================//
        //============== NEW LINE DETECTION ============//
        //==============================================//

        releasedText.clear();
        newLineParser.parse(bufferBetweenAnsiParserAndNewLineParser, releasedText);

        // Append the output of the ANSI parser to the "total" ANSI parser output buffer
        // This will be used if the user changes the filter pattern and wishes to re-run
        // it on buffered data.
        // NOTE: We only want to append NEW data added to the ANSI parser output, since
        // there may still be characters in there from last time this method was called, and
        // we don't want to add them twice
        totalNewLineParserOutput.copyCharsFrom(releasedText, releasedText.getText().length());

        // Add released text to buffer
        bufferBetweenNewLineParserAndFiltering.shiftDataIn(releasedText, releasedText.getText().length());

        //==============================================//
        //================== FILTERING =================//
        //==============================================//

        // NOTE: filteredRxData is the actual text which gets displayed in the RX pane
        releasedText.clear();
        streamingFilter.parse(bufferBetweenNewLineParserAndFiltering, releasedText);

        // Add the released text to buffer
        bufferBetweenFilterAndControlCharParser.shiftDataIn(releasedText, releasedText.getText().length());

        //==============================================//
        //=========== ASCII CONTROL CHAR PARSING =======//
        //==============================================//

        releasedText.clear();
        asciiControlCharParser.parse(bufferBetweenFilterAndControlCharParser, releasedText);


        //==============================================//
        //=================== TRIMMING =================//
        //==============================================//

        // Trim total ANSI parser output
        if (totalNewLineParserOutput.getText().length() > bufferSize) {
            logger.debug("Trimming totalNewLineParserOutput...");
            int numOfCharsToRemove = totalNewLineParserOutput.getText().length() - bufferSize;
            totalNewLineParserOutput.removeChars(numOfCharsToRemove);
        }

        // NOTE: UI buffer is trimmed in view controller

        //==============================================//
        //============== LISTENER NOTIFICATION =========//
        //==============================================//

        // Call any listeners that want the raw data (the logging class of the model might be listening)
        logger.debug("Calling raw data listeners with data = \"" + Debugging.convertNonPrintable(data) + "\".");
        for (RawDataReceivedListener rawDataReceivedListener : rawDataReceivedListeners) {
            rawDataReceivedListener.run(data);
        }

        // Call any streamed text listeners
        // This is the output designed for the UI element to listen to to display text!
        // (the loggging class might also be listening)
        for (StreamedTextListener newStreamedTextListener : newOutputListeners) {
            // Make a copy so that the listeners can't modify the bufferBetweenFilterAndControlCharParser variable
            StreamedData copyOfFilterOutput = new StreamedData(releasedText);
            newStreamedTextListener.run(copyOfFilterOutput);
        }

        logger.debug(getClass().getSimpleName() + ".addRxData() finished.");
    }

    public void rerunFilterOnExistingData() {
        // Clear all filter output
        bufferBetweenFilterAndControlCharParser.clear();

        // We need to run the entire ANSI parser output back through the filter
        // Make a temp. StreamedData object that can be consumed (we want to preserve
        // totalNewLineParserOutput).
        StreamedData toBeConsumed = new StreamedData(totalNewLineParserOutput);

        // The normal bufferBetweenAnsiParserAndNewLineParser should now be changed to point
        // to this toBeConsumed object
        bufferBetweenNewLineParserAndFiltering = toBeConsumed;

        parse(new byte[]{});

        /*StreamedData releasedText = new StreamedData();

        streamingFilter.parse(toBeConsumed, releasedText);




        // Call any streamed text listeners
        for (StreamedTextListener newStreamedTextListener : newOutputListeners) {
            // Make a copy so that the listeners can't modify the bufferBetweenFilterAndControlCharParser variable
            StreamedData copyOfFilterOutput = new StreamedData(bufferBetweenFilterAndControlCharParser);
            newStreamedTextListener.run(copyOfFilterOutput);
        }

        // Since the filter output is the last parser in the chain,
        // it's data does not need to persist between calls
        bufferBetweenFilterAndControlCharParser.clear();*/
    }

    /**
     * Enables/disables the ANSI escape code parser.
     * @param trueFalse
     */
    public void setAnsiECEnabled(boolean trueFalse) {
        ansiECParser.isEnabled.set(trueFalse);
    }

    public void setNewLinePattern(String newLineString) {
        newLineParser.setNewLinePattern(newLineString);
    }

    /**
     * Sets the filter pattern to be used by the streaming filter.
     * @param filterPattern
     */
    public void setFilterPattern(String filterPattern) {
        streamingFilter.setFilterPattern(filterPattern);
    }

}
