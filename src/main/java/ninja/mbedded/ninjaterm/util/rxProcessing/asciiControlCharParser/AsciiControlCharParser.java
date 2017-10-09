package ninja.mbedded.ninjaterm.util.rxProcessing.asciiControlCharParser;

import javafx.beans.property.SimpleBooleanProperty;
import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import ninja.mbedded.ninjaterm.util.rxProcessing.streamedData.StreamedData;
import org.slf4j.Logger;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Detects ASCII control characters and inserts the appropriate visible unicode character equivalent.
 *
 * Used for visualising control characters.
 *
 * This needs to be run AFTER the new line parser has run, as this ASCII control char parser
 * will remove the characters that typically represent a new line.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @last-modified 2017-10-08
 * @since 2016-10-17
 */
public class AsciiControlCharParser {

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    public SimpleBooleanProperty replaceWithVisibleSymbols = new SimpleBooleanProperty(false);

    private Map<String, String> controlCharToVisibleChar = new HashMap<>();

    private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

    private String[][] controlCharToVisibleCharA = {
            { "\u0000", "␀"},
            { "\u0001", "␁"},
            { "\u0002", "␂"},
            { "\u0003", "␃"},
            { "\u0004", "␄"},
            { "\u0005", "␅"},
            { "\u0006", "␆"},
            { "\u0007", "␇"},
            { "\u0008", "␈"},
            { "\u0009", "␉"}, // Horizontal tab (standard tab)
            { "\n", "␤"},
            { "\u000B", "␋"},
            { "\u000C", "␌"},
            { "\r", "↵"},
            { "\u000E", "␎"},
            { "\u000F", "␏"},
            { "\u0010", "␐"},
            { "\u0011", "␑"},
            { "\u0012", "␒"},
            { "\u0013", "␓"},
            { "\u0014", "␔"},
            { "\u0015", "␕"},
            { "\u0016", "␖"},
            { "\u0017", "␗"},
            { "\u0018", "␘"},
            { "\u0019", "␙"},
            { "\u001A", "␚"},
            { "\u001B", "␛" },
            { "\u001C", "␜" },
            { "\u001D", "␝" },
            { "\u001E", "␞" },
            { "\u001F", "␟" },
            { "\u0020", "␠" },
            { "\u0021", "␡" },
            //{ "\u0022", "␢" },
            { "\u0023", "␣" },
            { "\u0024", "␤" },
            { "\u0025", "␥" },
            { "\u0026", "␦" },

    };

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public AsciiControlCharParser() {

        // Build the hashmap from the simple two-dimensional array
        for(String[] controlCharToVisibleCharMapping : controlCharToVisibleCharA) {
            controlCharToVisibleChar.put(controlCharToVisibleCharMapping[0], controlCharToVisibleCharMapping[1]);
        }

    }

    public void parse(StreamedData input, StreamedData releasedText) {

        Pattern pattern = Pattern.compile("\\p{Cntrl}");

        // Now create matcher object.
        Matcher matcher = pattern.matcher(input.getText());

        //String output = "";
        int currIndex = 0;

        while(matcher.find()) {
            logger.debug("Found regex match = \"" + matcher.group(0) + "\".");
            logger.debug("match start = " + matcher.start());
            logger.debug("match end = " + matcher.end());

            // Look for character in map
            String replacementChar = "";

            if(replaceWithVisibleSymbols.get()) {
                replacementChar = controlCharToVisibleChar.get(matcher.group(0));

                // If no replacement character was found for this control code, ignore it and continue onto next iteration of
                // loop
                if(replacementChar == "") {
                    logger.debug("No replacement char found for this control code.");
                } else {
                    logger.debug("Replacement char = " + replacementChar);
                }
            }

            // Shift all characters before this match
            releasedText.shiftDataIn(input, matcher.start() - currIndex, StreamedData.MarkerBehaviour.NOT_FILTERING);

            // Safely delete this char from the input
            // (it should now be the first character)
            input.removeChar(0, false);

            currIndex = matcher.end();

            if(replacementChar != null) {
                releasedText.append(replacementChar);
            }

            //output = output + beforeChars + replacementChar;

            //input = matcher.replaceFirst(replacementChar);

            //logger.debug("output = " + output);

        }

        // No more matches have been found, but we still need to copy the last piece of
        // text across (if any)
        //output = output + input.substring(currIndex, input.length());
        releasedText.shiftDataIn(input, input.getText().length(), StreamedData.MarkerBehaviour.NOT_FILTERING);

        //return output;
    }
}
