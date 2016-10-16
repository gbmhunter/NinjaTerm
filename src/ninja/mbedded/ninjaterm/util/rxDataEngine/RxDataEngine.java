package ninja.mbedded.ninjaterm.util.rxDataEngine;

import javafx.beans.property.ReadOnlyBooleanProperty;
import javafx.beans.property.ReadOnlyBooleanWrapper;
import javafx.beans.property.SimpleStringProperty;
import ninja.mbedded.ninjaterm.model.terminal.txRx.RawDataReceivedListener;
import ninja.mbedded.ninjaterm.model.terminal.txRx.StreamedTextListener;
import ninja.mbedded.ninjaterm.util.ansiECParser.AnsiECParser;
import ninja.mbedded.ninjaterm.util.debugging.Debugging;
import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import ninja.mbedded.ninjaterm.util.newLineParser.NewLineParser;
import ninja.mbedded.ninjaterm.util.streamedText.StreamedText;
import ninja.mbedded.ninjaterm.util.streamingFilter.StreamingFilter;
import ninja.mbedded.ninjaterm.util.stringUtils.StringUtils;
import org.slf4j.Logger;

import java.util.ArrayList;
import java.util.List;

/**
 * The entire RX data processing engine, encapsulated in a single class.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-10-14
 * @last-modified 2016-10-14
 */
public class RxDataEngine {

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

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
    private StreamedText frozenAnsiParserOutput = new StreamedText();

    private StreamedText bufferBetweenAnsiParserAndNewLineParser = new StreamedText();

    private NewLineParser newLineParser = new NewLineParser("\n");

    private StreamedText bufferBetweenNewLineParserAndFiltering = new StreamedText();

    /**
     * Used to provide filtering functionality to the RX data.
     */
    private StreamingFilter streamingFilter = new StreamingFilter();

    /**
     * Buffer to hold the streamed text which is output from the filter.
     */
    public StreamedText filterOutput = new StreamedText();

    /**
     * This is a buffer for the output of the ANSI parser. This is for when the filter text
     * is changed, and the user wishes to re-run the filter over data stored in the buffer.
     *
     * This only contains data which has been unfrozen. All frozen data will remain in
     * <code>frozenAnsiParserOutput</code> until data is unfrozen again
     */
    public StreamedText totalNewLineParserOutput = new StreamedText();



    public List<RawDataReceivedListener> rawDataReceivedListeners = new ArrayList<>();

    /**
     * This event is emitted every time the ANSI parser is run. The output of the ANSI
     * parser is passed along with the event.
     */
    public List<StreamedTextListener> ansiParserOutputListeners = new ArrayList<>();
    public List<StreamedTextListener> newStreamedTextListeners = new ArrayList<>();

    public ReadOnlyBooleanProperty isRxFrozen = new ReadOnlyBooleanWrapper();

    public int bufferSize = 20000;



    private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    /**
     *
     *  <p>
     *     1. Receive RX data as pure string
     *     2. Pass through ANSI escape code parser. Escape code parser may hold back certain characters. This takes
     *              in a string put outs a StreamedText object. It populates the textColours array with objects that
     *              what colour and where colour changes occur.
     *     3. Pass through new line detecter. This does not modify the textual data, but populates the
     *              <code>newLineMarkers</code> array with entries and where new lines are to be inserted. This may
     *              hold back data if a partial new line is detected.
     *     3. Pass through ASCII control code parser. This finds all ASCII control codes, and either converts
     *              them to their visible unicode symbol equivalent, or removes them.
     *     4. Pass through filter. Filter only releases lines of text which match the provided pattern. Filter
     *              may hold back text which contains a partial match.
     *     5. The resulting StreamedText object is outputted to any listeners (the RX pane on the GUI should be
     *              listening to this).
     * </p>
     *
     * @param data
     */
    public void parse(String data) {
        logger.debug(getClass().getSimpleName() + ".addRxData() called with data = \"" + Debugging.convertNonPrintable(data) + "\".");

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
        StreamedText releasedText = new StreamedText();
        ansiECParser.parse(data, releasedText);

        logger.debug("releasedText = " + Debugging.convertNonPrintable(releasedText.toString()));

        /*frozenAnsiParserOutput.shiftCharsIn(releasedText, releasedText.getText().length());
        if(isRxFrozen.get()) {
            return;
        }*/

        // Fire ansiParserOutput event
        /*for (StreamedTextListener streamedTextListener : ansiParserOutputListeners) {
            // Create a new copy of the streamed text so that the listeners can't modify
            // the contents by mistake
            StreamedText streamedText = new StreamedText(frozenAnsiParserOutput);
            streamedTextListener.run(streamedText);
        }*/

        // Now add all the new ANSI parser output to any that was not used up by the
        // streaming filter from last time
        bufferBetweenAnsiParserAndNewLineParser.shiftCharsIn(releasedText, releasedText.getText().length());

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
        bufferBetweenNewLineParserAndFiltering.shiftCharsIn(releasedText, releasedText.getText().length());

        //==============================================//
        //================== FILTERING =================//
        //==============================================//

        // NOTE: filteredRxData is the actual text which gets displayed in the RX pane
        streamingFilter.parse(bufferBetweenNewLineParserAndFiltering, filterOutput);

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
        for (StreamedTextListener newStreamedTextListener : newStreamedTextListeners) {
            // Make a copy so that the listeners can't modify the filterOutput variable
            StreamedText copyOfFilterOutput = new StreamedText(filterOutput);
            newStreamedTextListener.run(copyOfFilterOutput);
        }

        // Since the filter output is the last parser in the chain,
        // it's data does not need to persist between calls
        filterOutput.clear();

        logger.debug(getClass().getSimpleName() + ".addRxData() finished.");
    }

    public void rerunFilterOnExistingData() {
        // Clear all filter output
        filterOutput.clear();

        // We need to run the entire ANSI parser output back through the filter
        // Make a temp. StreamedText object that can be consumed (we want to preserve
        // totalNewLineParserOutput).
        StreamedText toBeConsumed = new StreamedText(totalNewLineParserOutput);

        // The normal bufferBetweenAnsiParserAndNewLineParser should now be changed to point
        // to this toBeConsumed object
        bufferBetweenNewLineParserAndFiltering = toBeConsumed;

        streamingFilter.parse(toBeConsumed, filterOutput);

        // Notify that there is new UI data to display
            /*for (StreamedTextListener newStreamedTextListener : newStreamedTextListeners) {
                newStreamedTextListener.run(filterOutput);
            }*/
        // Call any streamed text listeners (but only if RX data is not frozen)
        for (StreamedTextListener newStreamedTextListener : newStreamedTextListeners) {
            // Make a copy so that the listeners can't modify the filterOutput variable
            StreamedText copyOfFilterOutput = new StreamedText(filterOutput);
            newStreamedTextListener.run(copyOfFilterOutput);
        }

        // Since the filter output is the last parser in the chain,
        // it's data does not need to persist between calls
        filterOutput.clear();
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
