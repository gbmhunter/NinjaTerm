package ninja.mbedded.ninjaterm.util.streamedText;

import ninja.mbedded.ninjaterm.util.debugging.Debugging;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Created by gbmhu on 2016-09-28.
 * <p>
 * Class contains a static method for shifting a provided number of characters from one input
 * <code>{@link StreamedText}</code> object to another output <code>{@link StreamedText}</code>
 * object.
 */
public class StreamFilterV2 {

    //private StreamedText heldStreamedText = new StreamedText();

    private boolean releaseTextOnCurrLine = false;

    /**
     * This method provides a filtering function based on an incoming stream of data.
     *
     * @param filterText Text to filter by.
     */
    public void streamFilter(
            StreamedTextV2 inputStreamedText,
            StreamedTextV2 outputStreamedText,
            String filterText) {

        System.out.println(getClass().getSimpleName() + ".streamFilter() called with:");
        System.out.println("inputStreamedText { " + Debugging.convertNonPrintable(inputStreamedText.toString()) + "}.");
        System.out.println("outputStreamedText { " + Debugging.convertNonPrintable(outputStreamedText.toString()) + "}.");

        if(inputStreamedText.getText().equals("")) {
            System.out.println("No filtering to perform. Returning...");
            return;
        }

        // Append all input streamed text onto the end of the held streamed text
        //StreamedText.shiftChars(inputStreamedText, heldStreamedText, inputStreamedText.numChars());

        // heldTextForLastNode + all text in heldNodes should equal a line of text being held intil
        // a pattern match occurs
        //String serializedHeldText = heldStreamedText.serialize();
        //System.out.println("Held text serialised. serializedHeldText = " + Debugging.convertNonPrintable(serializedHeldText));

        // Search for new line characters
        String lines[] = inputStreamedText.getText().split("(?<=[\\n])");

        // This keeps track of where we are relative to the start of the
        // heldLineOfText variable

        for (String line : lines) {

            // Check to see if we can release all text on this line without even bothering
            // to check for a match. This will occur if a match has already occurred on this line.
            if(releaseTextOnCurrLine) {
                System.out.println("releaseTextOnCurrLine = true. Releasing text " + Debugging.convertNonPrintable(line));
                outputStreamedText.shiftCharsIn(inputStreamedText, line.length());

                if(hasNewLineChar(line)) {
                    releaseTextOnCurrLine = false;
                }

                // Jump to next iteration of for loop
                System.out.println("Going to next iteration of loop.");
                continue;
            }

            Pattern pattern = Pattern.compile(filterText);
            Matcher matcher = pattern.matcher(line);

            if (matcher.find()) {
                // Match in line found!
                System.out.println("Match in line found. Line = " + Debugging.convertNonPrintable(line));


                // We can release all text/nodes up to the end of this line
                int numCharsToRelease = line.length();
                System.out.println("numCharsToRelease = " + numCharsToRelease);
                outputStreamedText.shiftCharsIn(inputStreamedText, numCharsToRelease);

                // Check to see if this is the last line. If so, set the releaseTextOnCurrLine to true
                // so that next time this function is called, any other text which is also on this line
                // will be released without question

                if(line == lines[lines.length - 1] && !hasNewLineChar(line)) {
                    releaseTextOnCurrLine = true;
                }


            } else {
                // No match found on this line. If this line is completed, then we know there can never be a match,
                // and it can be deleted from the heldStreamedText
                System.out.println("No match found on line = " + Debugging.convertNonPrintable(line));

                if(hasNewLineChar(line)) {
                    System.out.println("Deleting line.");
                    outputStreamedText.removeChars(line.length());
                }

            }
        } // for (String line : lines)

        System.out.println(getClass().getSimpleName() + ".streamFilter() finished. Variables are now:");
        System.out.println("inputStreamedText { " + Debugging.convertNonPrintable(inputStreamedText.toString()) + "}.");
        System.out.println("outputStreamedText { " + Debugging.convertNonPrintable(outputStreamedText.toString()) + "}.");

    }

    public static boolean hasNewLineChar(String line) {
        Pattern pattern = Pattern.compile("\n");
        Matcher matcher = pattern.matcher(line);

        if(matcher.find())
            return true;
        else
            return false;
    }

}
