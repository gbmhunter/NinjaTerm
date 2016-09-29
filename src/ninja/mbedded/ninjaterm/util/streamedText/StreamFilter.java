package ninja.mbedded.ninjaterm.util.streamedText;

import ninja.mbedded.ninjaterm.util.streamedText.StreamedText;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Created by gbmhu on 2016-09-28.
 * <p>
 * Class contains a static method for shifting a provided number of characters from one input
 * <code>{@link StreamedText}</code> object to another output <code>{@link StreamedText}</code>
 * object.
 */
public class StreamFilter {

    private StreamedText heldStreamedText = new StreamedText();

    /**
     * This method provides a filtering function based on an incoming stream of data.
     *
     * @param filterText Text to filter by.
     */
    public void streamFilter(
            StreamedText inputStreamedText,
            StreamedText outputStreamedText,
            String filterText) {

        // Append all input streamed text onto the end of the held streamed text
        StreamedText.shiftChars(inputStreamedText, heldStreamedText, inputStreamedText.numChars());

        // heldTextForLastNode + all text in heldNodes should equal a line of text being held intil
        // a pattern match occurs
        String serializedHeldText = heldStreamedText.serialize();
        System.out.println("Held text serialised. serializedHeldText = " + serializedHeldText);

        System.out.println("Concatenated line of text = " + serializedHeldText);

        // Search for new line characters
        String lines[] = serializedHeldText.split("(?<=[\\r])");

        // This keeps track of where we are relative to the start of the
        // heldLineOfText variable

        for (String line : lines) {
            Pattern pattern = Pattern.compile(filterText);
            Matcher matcher = pattern.matcher(line);

            if (matcher.find()) {
                // Match in line found!
                System.out.println("Match in line found. Line = " + line);

                // We can release all text/nodes up to the end of this line
                int numCharsToRelease = matcher.end();
                System.out.println("numCharsToRelease = " + numCharsToRelease);
                StreamedText.shiftChars(heldStreamedText, outputStreamedText, numCharsToRelease);


            } else {
                // No match found on this line. If this line is completed, then we know there can never be a match,
                // and it can be deleted from the heldStreamedText
                System.out.println("No match found. Line = " + line);

                heldStreamedText.removeChars(matcher.end());
            }
        }

    }
}
