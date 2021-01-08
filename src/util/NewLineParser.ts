import StreamedData, { MarkerBehaviour } from './StreamedData'

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
    isEnabled = true

    newLinePattern: RegExp;

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    constructor(newLineString: string) {
        //this.newLineString = newLineString;
        this.newLinePattern = RegExp(newLineString)
    }

    setNewLinePattern(newLineString: string) {
        this.newLinePattern = RegExp(newLineString)
    }

    getNewLinePattern() {
        return this.newLinePattern
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
    parse(input: StreamedData, output: StreamedData) {

        // If the new line paser has been disabled, then just shift
        // all input to the output, without adding any new line
        // markers
        if(!this.isEnabled) {
            output.shiftDataIn(input, input.getText().length, MarkerBehaviour.NOT_FILTERING);
            return;
        }

        // IF WE REACH HERE THEN THE NEW LINE PARSER IS ENABLED

        // Matcher matcher = newLinePattern.matcher(input.getText());

        let currShiftIndex = 0

        input.getText().search(this.newLinePattern)

        while(this.newLinePattern.test(input.getText())) {
          let match = this.newLinePattern.exec(input.getText())
          if(!match)
            throw Error('Expected match')

          // let firstMatch = match[0]
          let start = match.index
          let end = start + match[0].length - 1;
//            logger.debug("Match found. match = \"" + matcher.group(0) + "\"." +
//                    " Start index = " + matcher.start() + ", end index = " + matcher.end());

            // NEW LINE FOUND!


            // We want to add a new line marker at the position of the first character on the new line.
            // This is the same as matcher.end(). We also want to shift all data from input to
            // output up to this point
            output.shiftDataIn(input, end - currShiftIndex, MarkerBehaviour.NOT_FILTERING);

//            output.addNewLineMarkerAt(output.getText().length());
            output.getMarkers().push(new NewLineMarker(output.getText().length))

            currShiftIndex = end
        }

        // ALL NEW LINES FOUND!

        // Shift remaining characters from input to output
        output.shiftCharsInUntilPartialMatch(input, newLinePattern)


    }

}
