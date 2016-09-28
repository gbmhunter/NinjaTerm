package ninja.mbedded.ninjaterm.util.textInListUtils;

import javafx.scene.text.Text;

/**
 * Class contains a static method for shifting a provided number of characters from one input
 * <code>{@link StreamedText}</code> object to another output <code>{@link StreamedText}</code>
 * object.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-28
 * @last-modified   2016-09-28
 */
public class ShiftChars {

    /**
     * The states that the method <code>shiftChars</code> can be in as it does it's internal
     * processing. This state is not persistent from call to call.
     */
    private enum ShiftCharsState {
        EXTRACTING_FROM_APPEND_TEXT,
        EXTRACTING_FROM_NODES,
        FINISHED
    }

    /**
     * The method extracts the specified number of chars from the input and places them in the output.
     * It extract chars from the "to append" String first, and then starts removing chars from the first of the
     * Text nodes contained within the list.
     *
     * It also shifts any chars from still existing input nodes into the "to append" String
     * as appropriate.
     *
     * @param inputStreamedText
     * @param numChars
     * @return
     */
    public static void shiftChars(StreamedText inputStreamedText, StreamedText outputStreamedText, int numChars) {

        ShiftCharsState shiftCharsState = ShiftCharsState.EXTRACTING_FROM_APPEND_TEXT;

        while(true) {

            switch(shiftCharsState) {
                case EXTRACTING_FROM_APPEND_TEXT:

                    // There might not be any text to append, but rather the text
                    // starts in a fresh node
                    if(inputStreamedText.appendText.length() == 0) {
                        shiftCharsState = ShiftCharsState.EXTRACTING_FROM_NODES;
                        break;
                    }

                    // There are chars to extract
                    if(inputStreamedText.appendText.length() >= numChars) {


                        //outputStreamedText.appendText = inputStreamedText.appendText.substring(0, numChars);
                        addTextToStream(outputStreamedText, inputStreamedText.appendText.substring(0, numChars), AddMethod.APPEND);

                        inputStreamedText.appendText =
                                inputStreamedText.appendText.substring(
                                        numChars, inputStreamedText.appendText.length());

                        shiftCharsState = ShiftCharsState.FINISHED;
                        break;

                    } else {
                        // Need to extract more chars than what the append String has, so extract all, and continue in loop
                        // to extract more from nodes

                        //outputStreamedText.appendText = inputStreamedText.appendText;
                        addTextToStream(outputStreamedText, inputStreamedText.appendText, AddMethod.APPEND);
                        numChars -= inputStreamedText.appendText.length();
                        inputStreamedText.appendText = "";

                        shiftCharsState = ShiftCharsState.EXTRACTING_FROM_NODES;
                        break;
                    }

                case EXTRACTING_FROM_NODES:

                    // We can always work on node 0 since next time around the loop with old node 0
                    // would have been deleted
                    if(inputStreamedText.textNodes.size() == 0) {
                        int x = 2;
                    }
                    Text textNode = (Text)inputStreamedText.textNodes.get(0);

                    if(textNode.getText().length() >= numChars) {
                        // There is enough chars in this node to complete the shift

                        addTextToStream(outputStreamedText, textNode.getText().substring(0, numChars), AddMethod.NEW_NODE);
                        //outputStreamedText.textNodes.add(new Text(textNode.getText().substring(0, numChars)));
                        if(textNode.getText().equals("")) {
                            inputStreamedText.textNodes.remove(textNode);
                        } else {
                            // Although we have finished shifting chars into the output, the lingering chars in the
                            // input need to be moves in the "to append" string, and the node deleted
                            inputStreamedText.appendText = textNode.getText().substring(numChars, textNode.getText().length());
                            inputStreamedText.textNodes.remove(textNode);
                        }

                        shiftCharsState = ShiftCharsState.FINISHED;
                        break;
                    } else {
                        // Node isn't big enough, extract all characters, delete node and move onto the next
                        //outputStreamedText.textNodes.add(new Text(textNode.getText()));
                        addTextToStream(outputStreamedText, textNode.getText(), AddMethod.NEW_NODE);

                        inputStreamedText.textNodes.remove(textNode);
                        numChars -= textNode.getText().length();
                        break;
                    }

                case FINISHED:
                    return;
            }
        }
    }

    private enum AddMethod {
        APPEND,
        NEW_NODE
    }

    private static void addTextToStream(StreamedText streamedText, String text, AddMethod addMethod) {

        switch (addMethod) {
            case APPEND:

                if(streamedText.textNodes.size() == 0) {
                    streamedText.appendText += text;
                    return;
                } else {
                    Text textNode = (Text)streamedText.textNodes.get(streamedText.textNodes.size() - 1);
                    textNode.setText(textNode.getText() + text);
                    return;
                }

            case NEW_NODE:
                streamedText.textNodes.add(new Text(text));
                return;

        }
    }
}
