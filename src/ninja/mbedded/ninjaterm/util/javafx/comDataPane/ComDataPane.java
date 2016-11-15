package ninja.mbedded.ninjaterm.util.javafx.comDataPane;

import javafx.scene.layout.StackPane;
import javafx.scene.paint.Color;
import ninja.mbedded.ninjaterm.util.rxProcessing.streamedData.StreamedData;
import org.fxmisc.flowless.VirtualizedScrollPane;
import org.fxmisc.richtext.StyledTextArea;

import static ninja.mbedded.ninjaterm.util.rxProcessing.streamedData.StreamedData.NEW_LINE_CHAR_SEQUENCE_FOR_TEXT_FLOW;


/**
 * Created by gbmhu on 2016-11-14.
 */
public class ComDataPane extends StackPane {

    public final StyledTextArea<ParStyle, TextStyle> styledTextArea;

    /**
     * Variable to remember what colour to apply to the next character, since a <code>{@link StyledTextArea}</code>
     * has no way of adding a colour style to text which does not exist yet.
     */
    private Color colorToApplyToNextChar = null;

    public ComDataPane() {

        styledTextArea = new StyledTextArea<>(
                ParStyle.EMPTY, ( paragraph, style) -> paragraph.setStyle(style.toCss()),
                TextStyle.EMPTY.updateFontSize(12).updateFontFamily("monospace").updateTextColor(Color.GREEN),
                ( text, style) -> text.setStyle(style.toCss()));

        // Set the background to black
        styledTextArea.setStyle("-fx-background-color: black;");

        // We don't want the user to be able to edit the data pane
        styledTextArea.setEditable(false);
        //EditableStyledDocument editableStyledDocument = styledTextArea.getContent();
        //styledTextArea.replaceText(0, 0, "test");

        //styledTextArea.replaceText(styledTextArea.getLength(), styledTextArea.getLength(), "hello");

        // Add a virtual scroll pane (this is provided with the StyledTextArea)
        VirtualizedScrollPane virtualizedScrollPane = new VirtualizedScrollPane<>(styledTextArea);

        // Add scroll pane to StackPane
        getChildren().add(virtualizedScrollPane);

    }

    public int addData(StreamedData streamedData) {

        //==============================================//
        //============= INPUT ARG CHECKS ===============//
        //==============================================//

//        if (existingTextNodes.size() == 0) {
//            throw new IllegalArgumentException("existingTextNodes must have at least one text node already present.");
//        }
//
//        if (nodeIndexToStartShift < 0 || nodeIndexToStartShift > existingTextNodes.size()) {
//            throw new IllegalArgumentException("nodeIndexToStartShift must be greater than 0 and less than the size() of existingTextNodes.");
//        }

        // Reset the mutable integer (we don't care about what it's last value was)
        //numCharsAdded.set(0);
        int numCharsAdded = 0;

        //==============================================//
        //=== ADD ALL TEXT BEFORE FIRST COLOUR CHANGE ==//
        //==============================================//

        //Text lastTextNode = (Text) existingTextNodes.get(nodeIndexToStartShift - 1);

        // Copy all text before first ColourMarker entry into the first text node

        int indexOfLastCharPlusOne;
        if (streamedData.getColourMarkers().size() == 0) {
            indexOfLastCharPlusOne = streamedData.getText().length();
        } else {
            indexOfLastCharPlusOne = streamedData.getColourMarkers().get(0).position;
        }

        StringBuilder textToAppend = new StringBuilder(streamedData.getText().substring(0, indexOfLastCharPlusOne));

        // Create new line characters for all new line markers that point to text
        // shifted above
        int currNewLineMarkerIndex = 0;
        for (int i = 0; i < streamedData.getNewLineMarkers().size(); i++) {
            if (streamedData.getNewLineMarkers().get(currNewLineMarkerIndex) > indexOfLastCharPlusOne)
                break;

            textToAppend.insert(streamedData.getNewLineMarkers().get(currNewLineMarkerIndex) + i, "\n");
            currNewLineMarkerIndex++;
        }

        //lastTextNode.setText(lastTextNode.getText() + textToAppend.toString());
        int startIndex = styledTextArea.getLength();
        styledTextArea.replaceText(styledTextArea.getLength(), styledTextArea.getLength(), textToAppend.toString());
        int stopIndex = styledTextArea.getLength();

        // If the previous StreamedText object had a colour to apply when the next character was received,
        // add it now
        if(colorToApplyToNextChar != null) {
            styledTextArea.setStyle(
                    startIndex,
                    stopIndex,
                    TextStyle.EMPTY.updateFontSize(12).updateFontFamily("monospace").updateTextColor(colorToApplyToNextChar));
            colorToApplyToNextChar = null;
        }

        // Update the number of chars added with what was added to the last existing text node
        numCharsAdded += textToAppend.length();

        // Create new text nodes and copy all text
        // This loop won't run if there is no elements in the TextColors array
        //int currIndexToInsertNodeAt = nodeIndexToStartShift;
        for (int x = 0; x < streamedData.getColourMarkers().size(); x++) {
            //Text newText = new Text();

            int indexOfFirstCharInNode = streamedData.getColourMarkers().get(x).position;

            int indexOfLastCharInNodePlusOne;
            if (x >= streamedData.getColourMarkers().size() - 1) {
                indexOfLastCharInNodePlusOne = streamedData.getText().length();
            } else {
                indexOfLastCharInNodePlusOne = streamedData.getColourMarkers().get(x + 1).position;
            }

            textToAppend = new StringBuilder(streamedData.getText().substring(indexOfFirstCharInNode, indexOfLastCharInNodePlusOne));

            // Create new line characters for all new line markers that point to text
            // shifted above
            int insertionCount = 0;
            while (true) {
                if (currNewLineMarkerIndex >= streamedData.getNewLineMarkers().size())
                    break;

                if (streamedData.getNewLineMarkers().get(currNewLineMarkerIndex) > indexOfLastCharInNodePlusOne)
                    break;

                textToAppend.insert(
                        streamedData.getNewLineMarkers().get(currNewLineMarkerIndex) + insertionCount - indexOfFirstCharInNode,
                        NEW_LINE_CHAR_SEQUENCE_FOR_TEXT_FLOW);
                currNewLineMarkerIndex++;
                insertionCount++;
            }

            //==============================================//
            //==== ADD TEXT TO STYLEDTEXTAREA AND COLOUR ===//
            //==============================================//

            //newText.setText(textToAppend.toString());
            int insertionStartIndex = styledTextArea.getLength();
            styledTextArea.replaceText(insertionStartIndex, insertionStartIndex, textToAppend.toString());
            int insertionStopIndex = styledTextArea.getLength();

            //newText.setFill(getColourMarkers().get(x).color);
            styledTextArea.setStyle(
                    insertionStartIndex,
                    insertionStopIndex,
                    TextStyle.EMPTY.updateFontSize(12).updateFontFamily("monospace").updateTextColor(streamedData.getColourMarkers().get(x).color));

            // Update the num. chars added with all the text added to this new Text node
            numCharsAdded += textToAppend.length();

            //existingTextNodes.add(currIndexToInsertNodeAt, newText);

            //currIndexToInsertNodeAt++;
        }

        if (streamedData.getColorToBeInsertedOnNextChar() != null) {
            // Add new node with no text
            //Text text = new Text();
            //text.setFill(colorToBeInsertedOnNextChar);
            //existingTextNodes.add(currIndexToInsertNodeAt, text);
            colorToApplyToNextChar = streamedData.getColorToBeInsertedOnNextChar();
            //colorToBeInsertedOnNextChar = null;
        }

        // Clear all text and the TextColor list
        streamedData.clear();

        //checkAllColoursAreInOrder();

        return numCharsAdded;

    }

}
