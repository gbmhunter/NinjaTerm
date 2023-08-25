/* eslint-disable no-continue */
import StreamedData, { MarkerBehaviour } from 'util/StreamedData/StreamedData';
import ColourMarker from 'util/StreamedData/ColorMarker';

const extractNumbersAsArray = (ansiEscapeCode: string) => {
  // Input should be in the form
  // (ESC)[xx;xx;...xxm
  // We want to extract the x's

  // Trim of the (ESC) and [ chars from the start, and the m from the end
  const trimmedString = ansiEscapeCode.substring(2, ansiEscapeCode.length - 1);

  // System.out.println("trimmedString = " + trimmedString);

  const numbers = trimmedString.split(';');

  // System.out.println("numbers = " + toString(numbers));

  return numbers;
};

/**
 * Utility class that decodes ANSI escape sequences.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-26
 */
export default class AnsiECParser {
  codeToNormalColourMap: { [key: string]: string } = {};

  codeToBoldColourMap: { [key: string]: string } = {};

  // private Pattern pattern;
  pattern: RegExp;

  isEnabled = true;

  constructor() {
    // Populate the map with data
    // TODO: Add support for [ESC][0m
    this.codeToNormalColourMap['30'] = 'rgb(0, 0, 0)';
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
    // eslint-disable-next-line no-control-regex
    this.pattern = /\u{001B}\[[;\d]*m/gu;
  }

  /**
   *
   * Runs the ANSI escape code parser on the input streaming text, and produces the output StreamedData object.
   *
   * @param inputData           The input string which can contain display text and ANSI escape codes.
   * @param outputStreamedData    Contains streamed text that has been release from this parser.
   */
  parse(inputData: StreamedData, outputStreamedData: StreamedData) {
    if (!this.isEnabled) {
      // ASCII escape codes are disabled, so just return all the input plus any withheld text
      //            outputStreamedData.append(withheldCharsAndInputString);
      outputStreamedData.shiftDataIn(
        inputData,
        inputData.getText().length,
        MarkerBehaviour.NOT_FILTERING
      );
      return;
    }

    // IF WE REACH HERE ASCII ESCAPE CODE PARSING IS ENABLED
    const matches = inputData.getText().matchAll(this.pattern);
    let currShiftIndex = 0;

    // eslint-disable-next-line no-restricted-syntax
    for (const match of matches) {
      if (match.index === undefined) throw Error('match.index is undefined.');
      const matchStart = match.index;
      const matchEnd = match.index + match[0].length;

      // Everything up to the first matched character can be added to the last existing text node
      //            String preText = withheldCharsAndInputString.substring(currPositionInString, matcher.start());
      //            outputStreamedData.append(preText);
      outputStreamedData.shiftDataIn(
        inputData,
        matchStart - currShiftIndex,
        MarkerBehaviour.NOT_FILTERING
      );

      // Now extract the ANSI escape code
      const ansiEscapeCode = new StreamedData();
      ansiEscapeCode.shiftDataIn(
        inputData,
        matchEnd - matchStart,
        MarkerBehaviour.NOT_FILTERING
      );
      // System.out.println("ANSI esc seq = " + toHexString(ansiEscapeCode));

      // Save the remaining text to process
      // remainingInput = inputString.substring(m.end(), inputString.length());

      // Extract the numbers from the escape code
      const numbers = extractNumbersAsArray(ansiEscapeCode.getText());

      let correctMapToUse: { [key: string]: string };
      if (numbers.length === 1) {
        correctMapToUse = this.codeToNormalColourMap;
      } else if (numbers.length === 2 && numbers[1] === '1') {
        correctMapToUse = this.codeToBoldColourMap;
      } else {
        // ANSI escape sequence is not supported. Remove it from input and continue
        // throw new RuntimeException("Numbers not recognised!");
        currShiftIndex = matchEnd;
        continue;
      }

      // Get the colour associated with this code
      const color = correctMapToUse[numbers[0]];

      if (color == null) {
        console.log(
          'Escape sequence was not supported! escape code=',
          ansiEscapeCode.getText()
        );
        // The number in the escape sequence was not recognised. Update the current position in input string
        // to skip over this escape sequence, and continue to next iteration of loop.
        currShiftIndex = matchEnd;
        continue;
      }

      //            System.out.println("Valid escape seqeunce found.");

      // Create new Text object with this new color, and add to the text nodes
      //            outputStreamedData.setColorToBeInsertedOnNextChar(color);
      outputStreamedData
        .getMarkers()
        .push(new ColourMarker(outputStreamedData.getText().length, color));

      currShiftIndex = matchEnd;
    } // while (matcher.find())

    // ALL COMPLETE ANSI ESCAPE CODES FOUND!

    // Shift remaining characters from input to output
    outputStreamedData.shiftCharsInUntilPartialMatch(inputData, this.pattern);
  }
}
