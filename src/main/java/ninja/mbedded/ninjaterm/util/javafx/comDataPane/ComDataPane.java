package ninja.mbedded.ninjaterm.util.javafx.comDataPane;

import javafx.animation.FadeTransition;
import javafx.animation.Timeline;
import javafx.beans.property.SimpleBooleanProperty;
import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Label;
import javafx.scene.control.ScrollPane;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.input.MouseEvent;
import javafx.scene.input.ScrollEvent;
import javafx.scene.layout.Pane;
import javafx.scene.layout.StackPane;
import javafx.scene.paint.Color;
import javafx.scene.text.Text;
import javafx.util.Duration;
import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import ninja.mbedded.ninjaterm.util.rxProcessing.streamedData.StreamedData;
import org.fxmisc.flowless.VirtualizedScrollPane;
import org.fxmisc.richtext.InlineCssTextArea;
import org.fxmisc.richtext.InlineStyleTextArea;
import org.fxmisc.richtext.StyledTextArea;
import org.slf4j.Logger;

import java.util.OptionalInt;

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
    private final int DEFAULT_BUFFER_SIZE = 10000;

    /**
     * Opacity for auto-scroll button (which is just an image) when the mouse is not hovering over it.
     * This needs to be less than when the mouse is hovering on it.
     */
    private static final double AUTO_SCROLL_BUTTON_OPACITY_NON_HOVER = 0.35;

    /**
     * Opacity for auto-scroll button (which is just an image) when the mouse IS hovering over it.
     * This needs to be more than when the mouse is not hovering on it.
     */
    private static final double AUTO_SCROLL_BUTTON_OPACITY_HOVER = 1.0;

    //================================================================================================//
    //=========================================== ENUMS ==============================================//
    //================================================================================================//

    private enum ScrollState {

        /**
         * Scroll pane is always scrolled to the bottom so that new data is displayed.
         * This is the default behaviour.
         */
        FIXED_TO_BOTTOM,

        /**
         * The scroll amount will be modified as new data arrives and old data is removed, so that the user
         * is always looking at the same data, until the data is lost.
         */
        SMART_SCROLL,
    }

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    public SimpleBooleanProperty isCaretEnabled = new SimpleBooleanProperty(false);

    public SimpleStringProperty name = new SimpleStringProperty("");

    private Label nameLabel;

    private VirtualizedScrollPane virtualizedScrollPane;

//    public final StyledTextArea<ParStyle, TextStyle> styledTextArea;
    public final InlineCssTextArea styledTextArea;

    private Pane autoScrollButtonPane;

    /**
     * Variable to remember what colour to apply to the next character, since a <code>{@link StyledTextArea}</code>
     * has no way of adding a colour style to text which does not exist yet.
     */
    private Color colorToApplyToNextChar = null;

    public SimpleIntegerProperty bufferSize;

    private SimpleObjectProperty<ScrollState> scrollState = new SimpleObjectProperty<>(ScrollState.FIXED_TO_BOTTOM);

    private Text caretText;

    private int currCharPositionInText = 0;

    private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

    public SimpleIntegerProperty currNumChars = new SimpleIntegerProperty(0);

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public ComDataPane() {

        //==============================================//
        //============== STYLESHEET SETUP ==============//
        //==============================================//

        getStylesheets().add("ninja/mbedded/ninjaterm/resources/style.css");

        //==============================================//
        //============ STYLED TEXT AREA SETUP ==========//
        //==============================================//

//        styledTextArea = new StyledTextArea<>(
//                ParStyle.EMPTY, ( paragraph, style) -> paragraph.setStyle(style.toCss()),
//                TextStyle.EMPTY.updateFontSize(12).updateFontFamily("monospace").updateTextColor(Color.GREEN),
//                ( text, style) -> text.setStyle(style.toCss()));
        styledTextArea = new InlineCssTextArea();

        // Set the background to black
        styledTextArea.setStyle("-fx-background-color: black;");

        // We don't want the user to be able to edit the data pane
        styledTextArea.setEditable(true);

        styledTextArea.heightProperty().addListener((observable, oldValue, newValue) -> {
            logger.debug("heightProperty listener called.");
        });

        //styledTextArea.setPadding(new Insets(10, 10, 10, 10));

        styledTextArea.getStylesheets().add("ninja/mbedded/ninjaterm/resources/style.css");

        styledTextArea.setMinHeight(300);
        styledTextArea.setMaxHeight(Double.MAX_VALUE);

        styledTextArea.setShowCaret(StyledTextArea.CaretVisibility.ON);


        //==============================================//
        //========== VIRTUAL SCROLL AREA SETUP =========//
        //==============================================//

        // Add a virtual scroll pane (this is provided with the StyledTextArea)
        virtualizedScrollPane = new VirtualizedScrollPane<>(styledTextArea);

        virtualizedScrollPane.addEventFilter(ScrollEvent.ANY, event -> {
            handleUserScrolled(event);
        });

        // Make the vertical scrollbars always present, but the horizontal bars only if needed
        virtualizedScrollPane.setVbarPolicy(ScrollPane.ScrollBarPolicy.ALWAYS);
        virtualizedScrollPane.setHbarPolicy(ScrollPane.ScrollBarPolicy.AS_NEEDED);

        // Add scroll pane to StackPane
        getChildren().add(virtualizedScrollPane);

        //==============================================//
        //============= AUTO-SCROLL BUTTON =============//
        //==============================================//

        // PANE
        autoScrollButtonPane = new Pane();
        autoScrollButtonPane.setTranslateX(-20.0);
        autoScrollButtonPane.setTranslateY(-20.0);
        autoScrollButtonPane.setMaxWidth(100.0);
        autoScrollButtonPane.setMaxHeight(100.0);

        // IMAGE
        ImageView scrollToBottomImageView = new ImageView();
        scrollToBottomImageView.setFitWidth(100.0);
        scrollToBottomImageView.setFitHeight(100.0);
        scrollToBottomImageView.setImage(new Image("ninja/mbedded/ninjaterm/util/javafx/comDataPane/down-arrow.png"));
        scrollToBottomImageView.getStyleClass().add("scrollToBottomButton");
        autoScrollButtonPane.getChildren().add(scrollToBottomImageView);

        getChildren().add(autoScrollButtonPane);
        setAlignment(autoScrollButtonPane, Pos.BOTTOM_RIGHT);

        //=============== VISIBILITY SETUP ==============//

        // Attach handler
        scrollState.addListener((observable, oldValue, newValue) -> {
            handleScrollStateChanged();
        });

        // Call once to setup default
        handleScrollStateChanged();

        //================= OPACITY CHANGES =============//
        autoScrollButtonPane.addEventFilter(MouseEvent.MOUSE_ENTERED, (MouseEvent mouseEvent) -> {
                    scrollToBottomImageView.setOpacity(AUTO_SCROLL_BUTTON_OPACITY_HOVER);
                }
        );

        autoScrollButtonPane.addEventFilter(MouseEvent.MOUSE_EXITED, (MouseEvent mouseEvent) -> {
                    scrollToBottomImageView.setOpacity(AUTO_SCROLL_BUTTON_OPACITY_NON_HOVER);
                }
        );

        /**
         * This will be called when the user clicks the down arrow button
         */
        autoScrollButtonPane.addEventFilter(MouseEvent.MOUSE_CLICKED, (MouseEvent mouseEvent) -> {
                    //logger.debug("Mouse click detected! " + mouseEvent.getSource());
                    handleScrollToBottomButtonClicked();
                }
        );

        //==============================================//
        //============== BUFFER SIZE SETUP =============//
        //==============================================//

        bufferSize = new SimpleIntegerProperty(DEFAULT_BUFFER_SIZE);
        bufferSize.addListener((observable, oldValue, newValue) -> {
            trimBufferIfRequired();
        });


        //==============================================//
        //================== NAME SETUP ================//
        //==============================================//

        StackPane nameStackPane = new StackPane();
        nameStackPane.setMaxWidth(100.0);
        nameStackPane.setMaxHeight(20.0);
        nameStackPane.setAlignment(Pos.CENTER);
        nameStackPane.setStyle("-fx-background-color: rgba(150, 150, 150, 0.5); -fx-background-radius: 0 0 0 15;");
        // Add to the parent node
        getChildren().add(nameStackPane);
        setAlignment(nameStackPane, Pos.TOP_RIGHT);

        nameLabel = new Label();
        nameLabel.setAlignment(Pos.CENTER);
        nameLabel.setStyle("-fx-text-fill: white;");
        // Add to parent node
        nameStackPane.getChildren().add(nameLabel);

        // EVENT LISTENERS
        name.addListener((observable, oldValue, newValue) -> {
            nameLabel.setText(newValue);
        });

        nameLabel.setText(name.get());


        //==============================================//
        //============== CREATE CARET ==================//
        //==============================================//

        // Create caret symbol using ANSI character
        caretText = new Text("█");
        caretText.setFill(Color.LIME);

        // Add an animation so the caret blinks
        FadeTransition ft = new FadeTransition(Duration.millis(200), caretText);
        ft.setFromValue(1.0);
        ft.setToValue(0.1);
        ft.setCycleCount(Timeline.INDEFINITE);
        ft.setAutoReverse(true);
        ft.play();

        // Need to implement caret functionality!

    }

    /**
     *
     * @param streamedData The characters and assoicated markers to format into the COM data pane.
     * @return The number of chars added to the COM data pane.
     */
    public int addData(StreamedData streamedData) {

//        throw new UnsupportedOperationException("addData() no longer supported.");

        logger.debug("addData() called with streamedData = " + streamedData);

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

        int numCharsAdded = 0;

        // Remember the caret position before insertion of new text,
        // incase we need to use it for setting the scroll position
        int caretPosBeforeTextInsertion = styledTextArea.getCaretPosition();
        double estimatedScrollYBeforeTextInsertion = styledTextArea.getEstimatedScrollY();

        logger.debug("caretPosBeforeTextInsertion (before data added) = " + caretPosBeforeTextInsertion);
        logger.debug("estimatedScrollY (before data added) = " + estimatedScrollYBeforeTextInsertion);

        //==============================================//
        //=== ADD ALL TEXT BEFORE FIRST COLOUR CHANGE ==//
        //==============================================//

        //Text lastTextNode = (Text) existingTextNodes.get(nodeIndexToStartShift - 1);

        // Copy all text before first ColourMarker entry into the first text node

        int indexOfLastCharPlusOne;
        if (streamedData.getColourMarkers().size() == 0) {
            indexOfLastCharPlusOne = streamedData.getText().length();
        } else {
            indexOfLastCharPlusOne = streamedData.getColourMarkers().get(0).getCharPos();
        }

        StringBuilder textToAppend = new StringBuilder(streamedData.getText().substring(0, indexOfLastCharPlusOne));

        // Create new line characters for all new line markers that point to text
        // shifted above
        int currNewLineMarkerIndex = 0;
        for (int i = 0; i < streamedData.getNewLineMarkers().size(); i++) {
            if (streamedData.getNewLineMarkers().get(currNewLineMarkerIndex).charPos > indexOfLastCharPlusOne)
                break;

            textToAppend.insert(streamedData.getNewLineMarkers().get(currNewLineMarkerIndex).charPos + i, "\n");
            currNewLineMarkerIndex++;
        }

        //lastTextNode.setText(lastTextNode.getText() + textToAppend.toString());
        int startIndex = styledTextArea.getLength();
        styledTextArea.replaceText(styledTextArea.getLength(), styledTextArea.getLength(), textToAppend.toString());
        int stopIndex = styledTextArea.getLength();

        // If the previous StreamedText object had a colour to apply when the next character was received,
        // add it now
        if(colorToApplyToNextChar != null) {
            /*styledTextArea.setStyle(
                    startIndex,
                    stopIndex,
                    TextStyle.EMPTY.updateFontSize(12).updateFontFamily("monospace").updateTextColor(colorToApplyToNextChar));*/
            /*styledTextArea.setStyle(
                    startIndex,
                    stopIndex,
                    "-fx-font-size: 12;");*/
            colorToApplyToNextChar = null;
        }

        // Update the number of chars added with what was added to the last existing text node
        numCharsAdded += textToAppend.length();

        // Create new text nodes and copy all text
        // This loop won't run if there is no elements in the TextColors array
        //int currIndexToInsertNodeAt = nodeIndexToStartShift;
        for (int x = 0; x < streamedData.getColourMarkers().size(); x++) {
            //Text newText = new Text();

            int indexOfFirstCharInNode = streamedData.getColourMarkers().get(x).getCharPos();

            int indexOfLastCharInNodePlusOne;
            if (x >= streamedData.getColourMarkers().size() - 1) {
                indexOfLastCharInNodePlusOne = streamedData.getText().length();
            } else {
                indexOfLastCharInNodePlusOne = streamedData.getColourMarkers().get(x + 1).getCharPos();
            }

            textToAppend = new StringBuilder(streamedData.getText().substring(indexOfFirstCharInNode, indexOfLastCharInNodePlusOne));

            logger.debug("textToAppend (before new lines added) = " + textToAppend);

            // Create new line characters for all new line markers that point to text
            // shifted above
            int insertionCount = 0;
            while (true) {
                if (currNewLineMarkerIndex >= streamedData.getNewLineMarkers().size())
                    break;

                if (streamedData.getNewLineMarkers().get(currNewLineMarkerIndex).getCharPos() > indexOfLastCharInNodePlusOne)
                    break;

                textToAppend.insert(
                        streamedData.getNewLineMarkers().get(currNewLineMarkerIndex).getCharPos() + insertionCount - indexOfFirstCharInNode,
                        NEW_LINE_CHAR_SEQUENCE_FOR_TEXT_FLOW);
                currNewLineMarkerIndex++;
                insertionCount++;
            }

            logger.debug("textToAppend (after new lines added) = " + textToAppend);

            //==============================================//
            //==== ADD TEXT TO STYLEDTEXTAREA AND COLOUR ===//
            //==============================================//

            final int insertionStartIndex = styledTextArea.getLength();
            styledTextArea.replaceText(insertionStartIndex, insertionStartIndex, textToAppend.toString());
            final int insertionStopIndex = styledTextArea.getLength();

            logger.debug("insertionStartIndex = " + insertionStartIndex + ", insertionStopIndex = " + insertionStopIndex);

            final Color textColor = streamedData.getColourMarkers().get(x).color;

            final Double red = textColor.getRed()*255.0;
            final Double green = textColor.getGreen()*255.0;
            final Double blue = textColor.getBlue()*255.0;
            final String textColorString = "rgb(" + red.intValue() + ", " + green.intValue() + ", " + blue.intValue() + ")";

            logger.debug("textColorString = " + textColorString);

            styledTextArea.setStyle(
                    insertionStartIndex,
                    insertionStopIndex,
                    "-fx-fill: " + textColorString + "; -fx-font-family: monospace; -fx-font-size: 12px;");

            // Update the num. chars added with all the text added to this new Text node
            numCharsAdded += textToAppend.length();

            //existingTextNodes.add(currIndexToInsertNodeAt, newText);

            //currIndexToInsertNodeAt++;
        }

//        if (streamedData..getColorToBeInsertedOnNextChar() != null) {
//            // Add new node with no text
//            //Text text = new Text();
//            //text.setFill(colorToBeInsertedOnNextChar);
//            //existingTextNodes.add(currIndexToInsertNodeAt, text);
//            colorToApplyToNextChar = streamedData.getColorToBeInsertedOnNextChar();
//            //colorToBeInsertedOnNextChar = null;
//        }

        // Clear the streamed data object, as we have consumed all the information
        // available in it
        streamedData.clear();

        //===================================================//
        //= TRIM START OF DOCUMENT IF EXCEEDS BUFFER LENGTH =//
        //===================================================//

        OptionalInt optionalInt = styledTextArea.hit(0, 10).getCharacterIndex();
        int charAtZeroTenBeforeRemoval;
        if(optionalInt.isPresent())
            charAtZeroTenBeforeRemoval = optionalInt.getAsInt();
        else
            charAtZeroTenBeforeRemoval = 0;


        logger.debug("charAtZeroTenBeforeRemoval = " + charAtZeroTenBeforeRemoval);

        // Trim the text buffer if needed
        // (this method will decide if required)
        trimBufferIfRequired();

        //==============================================//
        //============== SCROLL POSITION ===============//
        //==============================================//

//        logger.debug("currCharPositionInText (after data added) = " + currCharPositionInText);
//        logger.debug("caretPosition (after data added) = " + styledTextArea.getCaretPosition());
//        logger.debug("estimatedScrollY (after data added) = " + styledTextArea.getEstimatedScrollY());

        switch(scrollState.get()) {
            case FIXED_TO_BOTTOM:
                // This moves the caret to the end of the "document"
                currCharPositionInText = styledTextArea.getLength();
                styledTextArea.moveTo(currCharPositionInText);
                break;

            case SMART_SCROLL:

                // Scroll so that the same text is displayed in the view port
                // as before the text insertion/removalS
                styledTextArea.moveTo(charAtZeroTenBeforeRemoval);
                break;
            default:
                throw new RuntimeException("scrollState not recognised.");
        }


        return numCharsAdded;

    }

    public void clearData() {
        // Remove all text from the StyledTextArea node
        styledTextArea.replaceText(0, styledTextArea.getLength(), "");
    }

    /**
     * @return The numbers of chars removed (if any).
     *
     * WARNING: If text is trimmed, this will cause the scroll position to jump to the top of the
     * document.
     *
     */
    private int trimBufferIfRequired() {

        int numCharsToRemove = 0;

        if(styledTextArea.getLength() > bufferSize.get()) {

            // We need to trim the text buffer in the styled text area node
            numCharsToRemove = styledTextArea.getLength() - bufferSize.get();

            // Remove the earliest text by doing a replace() call, replacing with
            // nothing ("")
            styledTextArea.replaceText(0, numCharsToRemove, "");

        }

        return numCharsToRemove;
    }

    /**
     * This should be called when the user clicks the "scroll to bottom"
     * button.
     */
    private void handleScrollToBottomButtonClicked() {
        // Change state to fixed-to-bottom
        scrollState.set(ScrollState.FIXED_TO_BOTTOM);


        //autoScrollButtonPane.setVisible(false);

        // Manually perform one scroll-to-bottom, since the next automatic one won't happen until
        // more data is added via addData().
        styledTextArea.moveTo(styledTextArea.getLength());
    }

    /**
     * Updates the visibility of the scroll-to-bottom button.
     * This should be called when <code>scrollState</code> changes.
     */
    private void handleScrollStateChanged() {
        switch(scrollState.get()) {
            case FIXED_TO_BOTTOM:
                autoScrollButtonPane.setVisible(false);
                break;
            case SMART_SCROLL:
                autoScrollButtonPane.setVisible(true);
                break;
            default:
                throw new RuntimeException("scrollState not recognised.");
        }
    }

    private void handleUserScrolled(ScrollEvent scrollEvent) {

        // If the user scrolled downwards, we don't want to disable auto-scroll,
        // so check and return if so.
        if (scrollState.get() == ScrollState.SMART_SCROLL || scrollEvent.getDeltaY() <= 0)
            return;

        logger.debug("User has scrolled upwards while in SCROLL_TO_BOTTOM mode, disabling SCROLL_TO_BOTTOM...");

        // Since the user has now scrolled upwards (manually), disable the
        // auto-scroll
        scrollState.set(ScrollState.SMART_SCROLL);
    }

    public void setWrappingEnabled(Boolean value) {
        logger.debug("setWrappingEnabled() called.");
    }

    public void setWrappingWidthPx(double value) {
        logger.debug("setWrappingWidthPx() called.");
    }

}
