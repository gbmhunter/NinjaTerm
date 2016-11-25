package ninja.mbedded.ninjaterm.util.rxProcessing.timeStamp;

import javafx.beans.property.SimpleBooleanProperty;
import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import ninja.mbedded.ninjaterm.util.rxProcessing.streamedData.StreamedData;
import org.slf4j.Logger;

import java.time.LocalDateTime;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Parses a {@link StreamedData} object and adds time stamp markers.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-11-23
 * @last-modified 2016-11-25
 **/
public class TimeStampParser {

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    /**
     * Use this to enable/disable the time stamp parser.
     *
     * If the time stamp parser is disabled, <code>parse()</code> will just
     * pass all input to output, without adding any new line markers.
     */
    public SimpleBooleanProperty isEnabled = new SimpleBooleanProperty(true);

    private Pattern newLinePattern;

    private boolean nextCharIsOnNewLine = true;

    private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public TimeStampParser(String newLineString) {
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

        // If the parser has been disabled, then just shift
        // all input to the output, without adding any
        // markers
        if(!isEnabled.get()) {
            output.shiftDataIn(input, input.getText().length(), StreamedData.MarkerBehaviour.NOT_FILTERING);
            return;
        }

        // IF WE REACH HERE THEN THE PARSER IS ENABLED

        Matcher matcher = newLinePattern.matcher(input.getText());

        int currShiftIndex = 0;

        while(matcher.find()) {
            logger.debug("Match found. match = \"" + matcher.group(0) + "\"." +
                    " Start index = " + matcher.start() + ", end index = " + matcher.end());

            // NEW LINE FOUND!

            if(nextCharIsOnNewLine) {
                output.getMarkers().add(new TimeStampMarker(output.getText().length(), LocalDateTime.now()));
                nextCharIsOnNewLine = false;
            }


            // Shift all data from input to last character of end of new line
            // sequence into output
            output.shiftDataIn(input, matcher.end() - currShiftIndex, StreamedData.MarkerBehaviour.NOT_FILTERING);

            nextCharIsOnNewLine = true;

            currShiftIndex = matcher.end();
        }

        // ALL NEW LINES FOUND!

        int beforeLength = output.getText().length();

        // Shift remaining characters from input to output
        output.shiftCharsInUntilPartialMatch(input, newLinePattern);

        if(output.getText().length() > beforeLength && nextCharIsOnNewLine) {
            output.getMarkers().add(new TimeStampMarker(beforeLength, LocalDateTime.now()));
            nextCharIsOnNewLine = false;
        }


    }

}
