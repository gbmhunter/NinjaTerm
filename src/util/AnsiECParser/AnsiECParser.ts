import StreamedData, { MarkerBehaviour } from "util/StreamedData/StreamedData";
import ColourMarker from 'util/StreamedData/ColorMarker';

/**
 * Utility class that decodes ANSI escape sequences.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-26
 * @last-modified   2016-10-17
 */
export class AnsiECParser {

  codeToNormalColourMap: { [key: string]: string } = {};

  codeToBoldColourMap:  { [key: string]: string } = {};

  // private Pattern pattern;
  pattern: RegExp;

  /**
   * Partial matches and the end of provided input strings to <code>parse()</code> are
   * stored in this variable for the next time <code>parse() is called.</code>
   */
//    private String withheldTextWithPartialMatch = "";

  isEnabled = true;

  constructor () {
      // Populate the map with data
      this.codeToNormalColourMap["30"] = 'rgb(0, 0, 0)';
      this.codeToNormalColourMap['31'] = 'rgb(170, 0, 0)';
      this.codeToNormalColourMap['32'] = 'rgb(0, 170, 0)';
      this.codeToNormalColourMap['33'] = 'rgb(170, 85, 0)';
      this.codeToNormalColourMap['34'] = 'rgb(0, 0, 170)';
      this.codeToNormalColourMap['35'] = 'rgb(170, 0, 170)';
      this.codeToNormalColourMap['36'] = 'rgb(0, 170, 170)';
      this.codeToNormalColourMap['37'] = 'rgb(170, 170, 170)';

      this.codeToBoldColourMap['30'] = 'rgb(85, 85, 85)';
      this.codeToBoldColourMap['31'] = 'rgb(255, 85, 85)';
      this.codeToBoldColourMap['32'] = 'rgb(85, 255, 85)';
      this.codeToBoldColourMap['33'] = 'rgb(255, 255, 85)';
      this.codeToBoldColourMap['34'] = 'rgb(85, 85, 225)';
      this.codeToBoldColourMap['35'] = 'rgb(255, 85, 255)';
      this.codeToBoldColourMap['36'] = 'rgb(85, 255, 255)';
      this.codeToBoldColourMap['37'] = 'rgb(255, 255, 255)';

      // This pattern matches an ANSI escape code. It matches an arbitrary number of
      // numbers after the "[ESC][", separated by a ";" and then prefixed by a "m".
      this.pattern = /\u001B\[[;\d]*m/g;
  }

  /**
   *
   * Runs the ANSI escape code parser on the input streaming text, and produces the output StreamedData object.
   *
   * @param inputData           The input string which can contain display text and ANSI escape codes.
   * @param outputStreamedData    Contains streamed text that has been release from this parser.
   */
  parse(inputData: StreamedData, outputStreamedData: StreamedData) {

    //        System.out.println(getClass().getSimpleName() + ".parse() called with inputString = " + Debugging.convertNonPrintable(inputString));

          // Prepend withheld text onto the start of the input string
          // @// TODO: 2016-10-17 Remove the internal withheld data variable, and just keep the data in the inputData object until it is ready to be release. These next two lines are a hacky work around
    //        String withheldCharsAndInputString = withheldTextWithPartialMatch + inputData.getText();
    //        inputData.clear();

    //        withheldTextWithPartialMatch = "";

    if(!this.isEnabled) {
      // ASCII escape codes are disabled, so just return all the input plus any withheld text
      //            outputStreamedData.append(withheldCharsAndInputString);
      outputStreamedData.shiftDataIn(inputData, inputData.getText().length, MarkerBehaviour.NOT_FILTERING);
      return;
    }

      // IF WE REACH HERE ASCII ESCAPE CODE PARSING IS ENABLED

      // Matcher matcher = this.pattern.matcher(inputData.getText());
      let matches = inputData.getText().matchAll(this.pattern);
      //String remainingInput = "";
      let currShiftIndex = 0;

      //m.reset();
      // while (matcher.find()) {
      for (const match of matches) {
//            System.out.println("find() is true. m.start() = " + m.start() + ", m.end() = " + m.end() + ".");
        if (match.index === undefined) throw Error('match.index is undefined.');
        const matchStart = match.index;
        const matchEnd = match.index + match[0].length;

          // Everything up to the first matched character can be added to the last existing text node
//            String preText = withheldCharsAndInputString.substring(currPositionInString, matcher.start());
//            outputStreamedData.append(preText);
        outputStreamedData.shiftDataIn(
                inputData,
                matchStart - currShiftIndex,
                MarkerBehaviour.NOT_FILTERING);


          // Now extract the ANSI escape code
          let ansiEscapeCode = new StreamedData();
          ansiEscapeCode.shiftDataIn(
                  inputData,
                  matchEnd - matchStart,
                  MarkerBehaviour.NOT_FILTERING);
          //System.out.println("ANSI esc seq = " + toHexString(ansiEscapeCode));

          // Save the remaining text to process
          //remainingInput = inputString.substring(m.end(), inputString.length());

          // Extract the numbers from the escape code
          const numbers = this.extractNumbersAsArray(ansiEscapeCode.getText());

          let correctMapToUse: { [key: string]: string };
          if(numbers.length == 1) {
              correctMapToUse = this.codeToNormalColourMap;
          } else if(numbers.length == 2 && numbers[1] === "1") {
              correctMapToUse = this.codeToBoldColourMap;
          } else {
              // ANSI escape sequence is not supported. Remove it from input and continue
              //throw new RuntimeException("Numbers not recognised!");
              currShiftIndex = matchEnd;
              continue;
          }

          // Get the colour associated with this code
          const color = correctMapToUse[numbers[0]];

          if(color == null) {
              console.log("Escape sequence was not supported!");
              // The number in the escape sequence was not recognised. Update the current position in input string
              // to skip over this escape sequence, and continue to next iteration of loop.
              currShiftIndex = matchEnd;
              continue;
          }

//            System.out.println("Valid escape seqeunce found.");

          // Create new Text object with this new color, and add to the text nodes
//            outputStreamedData.setColorToBeInsertedOnNextChar(color);
          outputStreamedData.getMarkers().push(new ColourMarker(outputStreamedData.getText().length, color));

          currShiftIndex = matchEnd;

      } // while (matcher.find())

      // ALL COMPLETE ANSI ESCAPE CODES FOUND!

      // Shift remaining characters from input to output
      outputStreamedData.shiftCharsInUntilPartialMatch(inputData, this.pattern);

  }

  extractNumbersAsArray(ansiEscapeCode: string) {
    // Input should be in the form
    // (ESC)[xx;xx;...xxm
    // We want to extract the x's

    // Trim of the (ESC) and [ chars from the start, and the m from the end
    let trimmedString = ansiEscapeCode.substring(2, ansiEscapeCode.length - 1);

    //System.out.println("trimmedString = " + trimmedString);

    let numbers = trimmedString.split(";");

    //System.out.println("numbers = " + toString(numbers));

    return numbers;
  }

}
