package ninja.mbedded.ninjaterm.util.stringUtils;

import javafx.scene.paint.Color;
import ninja.mbedded.ninjaterm.util.rxProcessing.streamedData.StreamedData;

import java.io.PrintWriter;
import java.io.StringWriter;

/**
 * Created by gbmhu on 2016-10-14.
 */
public class StringUtils {

    /**
     * Trims a string to the provided number of characters. Removes characters from the start of the string
     * (the "old" chars).
     *
     * @param data
     * @param desiredLength
     * @return The trimmed string.
     */
    public static String removeOldChars(String data, int desiredLength) {
        return data.substring(data.length() - desiredLength, data.length());
    }

    /**
     * Counts the number of new lines in a string (new lines are defined as what a JavaFX TextFlow object
     * considers a new line).
     * @param data
     * @return  The number of new lines.
     */
    public static int numNewLines(String data) {

        int numNewLines = 0;

        for(int i = 0; i < data.length(); i++) {
            if(data.charAt(i) == StreamedData.NEW_LINE_CHAR_SEQUENCE_FOR_TEXT_FLOW) {
                numNewLines++;
            }
        }

        return numNewLines;
    }

    /**
     * Converts a throwable (such as an exception) into a full blown string, just like how
     * IntelliJ print exceptions to stdout.
     * @param throwable
     * @return
     */
    public static String throwableToString(final Throwable throwable) {
        final StringWriter sw = new StringWriter();
        final PrintWriter pw = new PrintWriter(sw, true);
        throwable.printStackTrace(pw);
        return sw.getBuffer().toString();
    }


    public static String toWebColor( Color color ) {
        return String.format( "#%02X%02X%02X",
                (int)( color.getRed() * 255 ),
                (int)( color.getGreen() * 255 ),
                (int)( color.getBlue() * 255 ) );
    }

}
