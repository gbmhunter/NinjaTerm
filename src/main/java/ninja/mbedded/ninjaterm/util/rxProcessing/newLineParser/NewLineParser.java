package ninja.mbedded.ninjaterm.util.rxProcessing.newLineParser;

import javafx.beans.property.SimpleBooleanProperty;
import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import ninja.mbedded.ninjaterm.util.rxProcessing.streamedData.StreamedData;
import org.slf4j.Logger;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Detects where to add new line markers in the input streamed text, and releases
 * text to the output when processing is finished.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-10-15
 * @last-modified 2016-10-18
 */
public class NewLineParser {

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    /**
     * Use this to enable/disable the new line parser.
     *
     * If the new line parser is disables, <code>parse()</code> will just
     * pass all input to output, without adding any new line markers.
     */
    public SimpleBooleanProperty isEnabled = new SimpleBooleanProperty(true);

    private Pattern newLinePattern;

    private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public NewLineParser(String newLineString) {
        //this.newLineString = newLineString;
        newLinePattern = Pattern.compile(newLineString);
    }

    public void setNewLinePattern(String newLineString) {
        newLinePattern = Pattern.compile(newLineString);
    }

    public String getNewLinePattern() {
        return newLinePattern.pattern();
    }

    /**
     * Searches the input for new lines. If new lines are found, it populates the
     * <code>newLineMarkers</code> array.
     * Once text has been searched, it shifts the data from the input to the output.
     *
     * Data may remain in the input if a partial match for a new line is found.
     *
     * @param input
     * @param output
     */
    public void parse(StreamedData input, StreamedData output) {

        // If the new line paser has been disabled, then just shift
        // all input to the output, without adding any new line
        // markers
        if(!isEnabled.get()) {
            output.shiftDataIn(input, input.getText().length(), StreamedData.MarkerBehaviour.NOT_FILTERING);
            return;
        }

        // IF WE REACH HERE THEN THE NEW LINE PASER IS ENABLED

        Matcher matcher = newLinePattern.matcher(input.getText());

        int currShiftIndex = 0;

        while(matcher.find()) {
            logger.debug("Match found. match = \"" + matcher.group(0) + "\"." +
                    " Start index = " + matcher.start() + ", end index = " + matcher.end());

            // NEW LINE FOUND!


            // We want to add a new line marker at the position of the first character on the new line.
            // This is the same as matcher.end(). We also want to shift all data from input to
            // output up to this point
            output.shiftDataIn(input, matcher.end() - currShiftIndex, StreamedData.MarkerBehaviour.NOT_FILTERING);

//            output.addNewLineMarkerAt(output.getText().length());
            output.getMarkers().add(new NewLineMarker(output.getText().length()));

            currShiftIndex = matcher.end();
        }

        // ALL NEW LINES FOUND!

        // Shift remaining characters from input to output
        output.shiftCharsInUntilPartialMatch(input, newLinePattern);


    }

}
