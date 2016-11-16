package ninja.mbedded.ninjaterm.util.javafx.comDataPane;

import javafx.scene.input.ScrollEvent;
import javafx.scene.layout.StackPane;
import javafx.scene.paint.Color;
import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import ninja.mbedded.ninjaterm.util.rxProcessing.streamedData.StreamedData;
import org.fxmisc.flowless.VirtualizedScrollPane;
import org.fxmisc.richtext.StyledTextArea;
import org.slf4j.Logger;

import static ninja.mbedded.ninjaterm.util.rxProcessing.streamedData.StreamedData.NEW_LINE_CHAR_SEQUENCE_FOR_TEXT_FLOW;


/**
 * UI node which presents COM port data to the user (can be either TX, RX, or both).
 *
 * Uses a third-party <code>{@link StyledTextArea}</code> to enabled rich-text formatting
 * functionality.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-11-14
 * @last-modified 2016-14-16
 */
public class ComDataPane extends StackPane {

    //================================================================================================//
    //====================================== CLASS CONSTANTS =========================================//
    //================================================================================================//

    /**
     * The default the buffer size. This can be changed with <code>setBufferSize()</code>.
     */
    private final int DEFAULT_BUFFER_SIZE = 1000;

    //================================================================================================//
    //=========================================== ENUMS ==============================================//
    //================================================================================================//

    public enum ScrollBehaviour {
        /**
         * Scroll bars will be kept at a fixed position. If new data arrives, and old data is removed
         * (due to display buffer being full), the user will see the text moving, even though the scroll position
         * has not changed.
         */
        FIXED_POSITION,

        /**
         * The scroll amount will be modified as new data arrives and old data is removed, so that the user
         * is always looking at the same data, until the data is lost.
         */
        SMART_SCROLL,
    }

    private enum ScrollState {

        /**
         * Scroll pane is always scrolled to the bottom so that new data is displayed.
         * This is the default behaviour.
         */
        FIXED_TO_BOTTOM,

        /**
         * Scroll bars will be kept at a fixed position. If new data arrives, and old data is removed
         * (due to display buffer being full), the user will see the text moving, even though the scroll position
         * has not changed.
         */
        FIXED_POSITION,

        /**
         * The scroll amount will be modified as new data arrives and old data is removed, so that the user
         * is always looking at the same data, until the data is lost.
         */
        SMART_SCROLL,
    }

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    public final StyledTextArea<ParStyle, TextStyle> styledTextArea;

    private VirtualizedScrollPane virtualizedScrollPane;

    /**
     * Variable to remember what colour to apply to the next character, since a <code>{@link StyledTextArea}</code>
     * has no way of adding a colour style to text which does not exist yet.
     */
    private Color colorToApplyToNextChar = null;

    private int bufferSize;

    private ScrollBehaviour scrollBehaviour = ScrollBehaviour.FIXED_POSITION;
    private ScrollState scrollState = ScrollState.FIXED_TO_BOTTOM;


    private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public ComDataPane() {

        styledTextArea = new StyledTextArea<>(
                ParStyle.EMPTY, ( paragraph, style) -> paragraph.setStyle(style.toCss()),
                TextStyle.EMPTY.updateFontSize(12).updateFontFamily("monospace").updateTextColor(Color.GREEN),
                ( text, style) -> text.setStyle(style.toCss()));

        // Set the background to black
        styledTextArea.setStyle("-fx-background-color: black;");

        // We don't want the user to be able to edit the data pane
        styledTextArea.setEditable(false);

        styledTextArea.heightProperty().addListener((observable, oldValue, newValue) -> {
            logger.debug("heightProperty listener called.");
        });

        // Add a virtual scroll pane (this is provided with the StyledTextArea)
        virtualizedScrollPane = new VirtualizedScrollPane<>(styledTextArea);

        virtualizedScrollPane.totalHeightEstimateProperty().addListener((observable, oldValue, newValue) -> {
            logger.debug("totalHeightEstimateProperty() listener called. newValue = " + newValue);
        });

        virtualizedScrollPane.estimatedScrollYProperty().addListener((observable, oldValue, newValue) -> {
            logger.debug("estimatedScrollYProperty() listener called. newValue = " + newValue);
        });

        virtualizedScrollPane.addEventFilter(ScrollEvent.ANY, event -> {

            // If the user scrolled downwards, we don't want to disable auto-scroll,
            // so check and return if so.
            if (event.getDeltaY() <= 0)
                return;

            logger.debug("User has scrolled upwards, disabling auto-scroll...");

            // Since the user has now scrolled upwards (manually), disable the
            // auto-scroll
            //terminal.txRx.autoScrollEnabled.set(false);
            scrollState = ScrollState.FIXED_POSITION;

            //autoScrollButtonPane.setVisible(true);
        });


        // Add scroll pane to StackPane
        getChildren().add(virtualizedScrollPane);

        //==============================================//
        //============== BUFFER SIZE SETUP =============//
        //==============================================//

        this.bufferSize = DEFAULT_BUFFER_SIZE;

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

        // Trim the text buffer if needed
        // (this method will decide if required)
        trimBufferIfRequired();

        // Fix up the scroll position
        if(scrollState == ScrollState.FIXED_TO_BOTTOM) {
            //styledTextArea.setEstimatedScrollY(styledTextArea.getTotalHeightEstimate());

            // This moves the caret to the end of the "document"
            styledTextArea.moveTo(styledTextArea.getLength());
        }

        return numCharsAdded;

    }

    public int getBufferSize() {
        return bufferSize;
    }

    public void setBufferSize(int bufferSize) {
        this.bufferSize = bufferSize;
    }

    private void trimBufferIfRequired() {

        if(styledTextArea.getLength() > bufferSize) {

            // We need to trim the text buffer in the styled text area node
            int numCharsToRemove = styledTextArea.getLength() - bufferSize;

            // Remove the earliest text by doing a replace() call, replacing with
            // nothing ("")
            styledTextArea.replaceText(0, numCharsToRemove, "");

        }

    }

}
