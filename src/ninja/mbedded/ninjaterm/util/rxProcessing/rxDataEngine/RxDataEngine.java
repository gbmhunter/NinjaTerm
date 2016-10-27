package ninja.mbedded.ninjaterm.util.rxProcessing.rxDataEngine;

import javafx.beans.binding.Bindings;
import javafx.beans.property.*;
import ninja.mbedded.ninjaterm.model.terminal.txRx.RawDataReceivedListener;
import ninja.mbedded.ninjaterm.model.terminal.txRx.StreamedTextListener;
import ninja.mbedded.ninjaterm.util.rxProcessing.Decoding.Decoder;
import ninja.mbedded.ninjaterm.util.rxProcessing.Decoding.DecodingOptions;
import ninja.mbedded.ninjaterm.util.rxProcessing.ansiECParser.AnsiECParser;
import ninja.mbedded.ninjaterm.util.rxProcessing.asciiControlCharParser.AsciiControlCharParser;
import ninja.mbedded.ninjaterm.util.debugging.Debugging;
import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import ninja.mbedded.ninjaterm.util.rxProcessing.freezeParser.FreezeParser;
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
 * @last-modified 2016-10-21
 */
public class RxDataEngine {

    public final int DEFAULT_BUFFER_SIZE = 20000;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    // These are grouped by stream processing function

    //==============================================//
    //================== DECODER ===================//
    //==============================================//

    private Decoder decoder = new Decoder();

    public SimpleObjectProperty<DecodingOptions> selDecodingOption = new SimpleObjectProperty<>(DecodingOptions.ASCII);

    /**
     * Initialise with "" so that it does not display "null".
     */
    public SimpleStringProperty rawRxData = new SimpleStringProperty("");

    private StreamedData bufferBetweenDecoderAndFreezeParser = new StreamedData();

    //==============================================//
    //================ FREEZE PARSER ===============//
    //==============================================//

    private FreezeParser freezeParser = new FreezeParser();

    private StreamedData bufferBetweenFreezeParserAndAnsiParser = new StreamedData();

    public SimpleBooleanProperty isFrozen = freezeParser.isFrozen;

    //==============================================//
    //============ ANSI ESCAPE CODE PARSER =========//
    //==============================================//

    private AnsiECParser ansiECParser = new AnsiECParser();

    private StreamedData bufferBetweenAnsiParserAndNewLineParser = new StreamedData();

    //==============================================//
    //================ NEW LINE PARSER =============//
    //==============================================//

    public SimpleStringProperty newLinePattern = new SimpleStringProperty("\\n");

    private NewLineParser newLineParser = new NewLineParser(newLinePattern.get());

    private StreamedData bufferBetweenNewLineParserAndFiltering = new StreamedData();

    //==============================================//
    //==================== FILTER ==================//
    //==============================================//

    /**
     * Used to provide filtering functionality to the RX data.
     */
    private StreamingFilter streamingFilter = new StreamingFilter();

    /**
     * Buffer to hold the streamed text which is output from the filter and
     * consumed by the <code>asciiControlCharParser</code>.
     */
    public StreamedData bufferBetweenFilterAndControlCharParser = new StreamedData();

    //==============================================//
    //========== ASCII CONTROL CHAR PARSER =========//
    //==============================================//

    private AsciiControlCharParser asciiControlCharParser = new AsciiControlCharParser();

    /**
     * This is a buffer for the output of the ANSI parser. This is for when the filter text
     * is changed, and the user wishes to re-run the filter over data stored in the buffer.
     *
     * This only contains data which has been unfrozen. All frozen data will remain in
     * <code>frozenAnsiParserOutput</code> until data is unfrozen again
     */
    public StreamedData totalNewLineParserOutput = new StreamedData();


    /**
     * Listeners will be called whenever raw data is received.
     */
    public List<RawDataReceivedListener> rawDataReceivedListeners = new ArrayList<>();

    /**
     * This event is emitted when new streamed output is available. This is what the
     * RX pane in the UI should be listening for.
     */
    public List<StreamedTextListener> newOutputListeners = new ArrayList<>();

    public SimpleIntegerProperty maxBufferSize = new SimpleIntegerProperty(DEFAULT_BUFFER_SIZE);

    private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public RxDataEngine() {
        // Bind the selDecodingOption variable to the copy inside the Decoder object
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

        // If an external class modifies the new line pattern, update
        // the new line parser object correctly
        newLinePattern.addListener((observable, oldValue, newValue) -> {

            if(newValue.equals(""))
                newLineParser.isEnabled.set(false);
            else
                newLineParser.isEnabled.set(true);

            // Update the new line pattern in the new line parser
            // (note that this will only have any effect if the
            // new line parser is enabled)
            newLineParser.setNewLinePattern(newValue);

            logger.debug("newLineParser.isEnabled set to \"" + newLineParser.isEnabled.get() + "\" and newLineParser.newLinePattern set to \"" + newLineParser.getNewLinePattern() + "\".");

        });

        maxBufferSize.addListener((observable, oldValue, newValue) -> {
            logger.debug("maxBufferSize set to " + Integer.toString(newValue.intValue()) + ".");

            trimBuffer();
        });

        rawRxData.addListener((observable, oldValue, newValue) -> {
            trimBuffer();
        });
    }

    /**
     * Trims the internal RX buffer according to the value set in maxBufferSize.
     */
    public void trimBuffer() {
        logger.debug(
                "trimBuffer() called. rawRxData.length() = " + rawRxData.length() +
                ", maxBufferSize = " + maxBufferSize.get() + ".");
        // Truncate if necessary
        if (rawRxData.get().length() > maxBufferSize.get()) {
            // Remove old characters from buffer
            rawRxData.set(StringUtils.removeOldChars(rawRxData.get(), maxBufferSize.get()));
        }
    }

    /**
     * This method passes RX data. It encapsulates all the individual processes on the RX
     * stream.
     *
     * Process:
     *  <p>
     *     1. Receive RX data as byte array.
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
     * The method can be called with an empty byte array. This will cause all RX parsers to be run,
     * but without any new data (can be useful to do this after making changes to some of the
     * properties, e.g. the filter pattern).
     *
     * @param rxData    The received data from the COM port to process.
     */
    public void parse(byte[] rxData) {
        /*logger.debug(getClass().getSimpleName() + ".addRxData() called with data = \"" + Debugging.convertNonPrintable(data) + "\".");*/

        //==============================================//
        //==================== DECODER =================//
        //==============================================//

        String newDecodedData = decoder.parse(rxData);

        // Data should be automatically trimmed (there is a listener attached
        // to this property)
        rawRxData.set(rawRxData.get() + newDecodedData);

        bufferBetweenDecoderAndFreezeParser.append(newDecodedData);

        // This streamed data object is just to temporarily hold released output
        // from each parser, before it is shifted into the appropriate buffer
        StreamedData releasedData = new StreamedData();


        //==============================================//
        //================= FREEZE PARSER ==============//
        //==============================================//

        releasedData.clear();
        freezeParser.parse(bufferBetweenDecoderAndFreezeParser, releasedData);

        bufferBetweenFreezeParserAndAnsiParser.shiftDataIn(releasedData, releasedData.getText().length());

        //==============================================//
        //============== ANSI ESCAPE CODES =============//
        //==============================================//

        releasedData.clear();
        ansiECParser.parse(bufferBetweenFreezeParserAndAnsiParser, releasedData);

        logger.debug("releasedData = " + Debugging.convertNonPrintable(releasedData.toString()));

        /*frozenAnsiParserOutput.shiftDataIn(releasedData, releasedData.getText().length());
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
        bufferBetweenAnsiParserAndNewLineParser.shiftDataIn(releasedData, releasedData.getText().length());

        //frozenAnsiParserOutput.clear();

        logger.debug("Finished adding data to buffer between ANSI parser and filter. bufferBetweenAnsiParserAndNewLineParser = " + bufferBetweenAnsiParserAndNewLineParser);

        //==============================================//
        //============== NEW LINE DETECTION ============//
        //==============================================//

        releasedData.clear();
        newLineParser.parse(bufferBetweenAnsiParserAndNewLineParser, releasedData);

        // Append the output of the ANSI parser to the "total" ANSI parser output buffer
        // This will be used if the user changes the filter pattern and wishes to re-run
        // it on buffered data.
        // NOTE: We only want to append NEW data added to the ANSI parser output, since
        // there may still be characters in there from last time this method was called, and
        // we don't want to add them twice
        totalNewLineParserOutput.copyCharsFrom(releasedData, releasedData.getText().length());

        // Add released text to buffer
        bufferBetweenNewLineParserAndFiltering.shiftDataIn(releasedData, releasedData.getText().length());

        //==============================================//
        //================== FILTERING =================//
        //==============================================//

        // NOTE: filteredRxData is the actual text which gets displayed in the RX pane
        releasedData.clear();
        streamingFilter.parse(bufferBetweenNewLineParserAndFiltering, releasedData);

        // Add the released text to buffer
        bufferBetweenFilterAndControlCharParser.shiftDataIn(releasedData, releasedData.getText().length());

        //==============================================//
        //=========== ASCII CONTROL CHAR PARSING =======//
        //==============================================//

        releasedData.clear();
        asciiControlCharParser.parse(bufferBetweenFilterAndControlCharParser, releasedData);


        //==============================================//
        //=================== TRIMMING =================//
        //==============================================//

        // Trim total ANSI parser output
        if (totalNewLineParserOutput.getText().length() > maxBufferSize.get()) {
            logger.debug("Trimming totalNewLineParserOutput...");
            int numOfCharsToRemove = totalNewLineParserOutput.getText().length() - maxBufferSize.get();
            totalNewLineParserOutput.removeCharsFromStart(numOfCharsToRemove);
        }

        // NOTE: UI buffer is trimmed in view controller

        //==============================================//
        //============== LISTENER NOTIFICATION =========//
        //==============================================//

        // Call any listeners that want the raw data (the logging class of the model might be listening)
        logger.debug("Calling raw data listeners with data = \"" + Debugging.convertNonPrintable(newDecodedData) + "\".");
        for (RawDataReceivedListener rawDataReceivedListener : rawDataReceivedListeners) {
            rawDataReceivedListener.run(newDecodedData);
        }

        // Call any streamed text listeners
        // This is the output designed for the UI element to listen to to display text!
        // (the loggging class might also be listening)
        for (StreamedTextListener newStreamedTextListener : newOutputListeners) {
            // Make a copy so that the listeners can't modify the bufferBetweenFilterAndControlCharParser variable
            StreamedData copyOfFilterOutput = new StreamedData(releasedData);
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

        // Re-call parse() to process tha above changes, but
        // don't provide any new data
        parse(new byte[]{});
    }

    /**
     * Enables/disables the ANSI escape code parser.
     * @param trueFalse
     */
    public void setAnsiECEnabled(boolean trueFalse) {
        ansiECParser.isEnabled.set(trueFalse);
    }

    /**
     * Sets the filter pattern to be used by the streaming filter.
     * @param filterPattern
     */
    public void setFilterPattern(String filterPattern) {
        streamingFilter.setFilterPattern(filterPattern);
    }

}
