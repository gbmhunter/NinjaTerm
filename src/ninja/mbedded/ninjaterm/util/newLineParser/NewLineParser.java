package ninja.mbedded.ninjaterm.util.newLineParser;

import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import ninja.mbedded.ninjaterm.util.streamedText.StreamedText;
import org.slf4j.Logger;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Created by gbmhu on 2016-10-14.
 */
public class NewLineParser {

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    String newLineString;
    Pattern newLinePattern;

    private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public NewLineParser(String newLineString) {
        this.newLineString = newLineString;
        newLinePattern = Pattern.compile(newLineString);
    }

    /**
     * Searches the input for new lines. If new lines are found, it populates the newLineIndicies array.
     * Once text has been searched, it shifts the data from the input to the output.
     *
     * Data may remain in the input if a partial match for a new line is found.
     *
     * @param input
     * @param output
     */
    public void parse(StreamedText input, StreamedText output) {

        Matcher matcher = newLinePattern.matcher(input.getText());

        int currShiftIndex = 0;

        while(matcher.find()) {
            logger.debug("Match found. match = \"" + matcher.group(0) + "\"." +
                    " Start index = " + matcher.start() + ", end index = " + matcher.end());

            // NEW LINE FOUND!


            // We want to add a new line marker at the position of the first character on the new line.
            // This is the same as matcher.end(). We also want to shift all data from input to
            // output up to this point
            output.shiftCharsIn(input, matcher.end() - currShiftIndex);

            output.addNewLineMarkerAt(output.getText().length() - 1);

            currShiftIndex = matcher.end();
        }

        // ALL NEW LINES FOUND!

        // Shift reamining characters from input to output
        output.shiftCharsInUntilPartialMatch(input, newLinePattern);


    }

}
