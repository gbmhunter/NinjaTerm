package ninja.mbedded.ninjaterm.util.javafx.comDataPaneWeb;

import javafx.beans.property.SimpleBooleanProperty;
import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.value.ChangeListener;
import javafx.beans.value.ObservableValue;
import javafx.scene.control.Label;
import javafx.scene.input.ScrollEvent;
import javafx.scene.layout.Pane;
import javafx.scene.layout.StackPane;
import javafx.scene.paint.Color;
import javafx.scene.text.Text;
import javafx.scene.web.WebEngine;
import javafx.scene.web.WebView;
import netscape.javascript.JSObject;
import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import ninja.mbedded.ninjaterm.util.rxProcessing.streamedData.StreamedData;
import ninja.mbedded.ninjaterm.util.stringUtils.StringUtils;
import org.fxmisc.flowless.VirtualizedScrollPane;
import org.fxmisc.richtext.StyledTextArea;
import org.slf4j.Logger;
import org.w3c.dom.Document;


import java.net.URL;

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
public class ComDataPaneWeb extends StackPane {

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

    public final WebView webView;

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

    private WebEngine webEngine;

    private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public ComDataPaneWeb() {

        //==============================================//
        //============== STYLESHEET SETUP ==============//
        //==============================================//

        getStylesheets().add("ninja/mbedded/ninjaterm/resources/style.css");

        //==============================================//
        //============ STYLED TEXT AREA SETUP ==========//
        //==============================================//

        webView = new WebView();
        webEngine = webView.getEngine();

        webEngine.getLoadWorker().stateProperty().addListener((observable, oldValue, newValue) ->
        {
            JSObject window = (JSObject) webEngine.executeScript("window");
            JavaBridge javaBridge = new JavaBridge();
            window.setMember("java", javaBridge);
            webEngine.executeScript("console.log = function(message)\n" +
                    "{\n" +
                    "    java.log(message);\n" +
                    "}; console.log(\"test\")");

            enableFirebug(webEngine);
            webEngine.setUserStyleSheetLocation(getClass().getResource("style.css").toString());
        });

        getChildren().add(webView);

        final URL mapUrl = this.getClass().getResource("richText.html");

        webEngine.javaScriptEnabledProperty().set(true);

        webEngine.load(mapUrl.toExternalForm());
        //webEngine.load("http://docs.oracle.com/javafx/2/get_started/animation.htm");


        //==============================================//
        //============== BUFFER SIZE SETUP =============//
        //==============================================//

        bufferSize = new SimpleIntegerProperty(DEFAULT_BUFFER_SIZE);
        bufferSize.addListener((observable, oldValue, newValue) -> {
            trimBufferIfRequired();
        });




        // Need to implement caret functionality!

    }

    /**
     * Enables Firebug Lite for debugging a webEngine.
     * @param engine the webEngine for which debugging is to be enabled.
     */
    private static void enableFirebug(final WebEngine engine) {
        engine.executeScript("if (!document.getElementById('FirebugLite')){E = document['createElement' + 'NS'] && document.documentElement.namespaceURI;E = E ? document['createElement' + 'NS'](E, 'script') : document['createElement']('script');E['setAttribute']('id', 'FirebugLite');E['setAttribute']('src', 'https://getfirebug.com/' + 'firebug-lite.js' + '#startOpened');E['setAttribute']('FirebugLite', '4');(document['getElementsByTagName']('head')[0] || document['getElementsByTagName']('body')[0]).appendChild(E);E = new Image;E['setAttribute']('src', 'https://getfirebug.com/' + '#startOpened');}");
    }

    public int addData(StreamedData streamedData) {

        logger.debug("addData() called with streamedData = " + streamedData);

        int numCharsAdded = 0;

        // Remember the caret position before insertion of new text,
        // incase we need to use it for setting the scroll position
//        int caretPosBeforeTextInsertion = styledTextArea.getCaretPosition();
//        double estimatedScrollYBeforeTextInsertion = styledTextArea.getEstimatedScrollY();
//
//        logger.debug("caretPosBeforeTextInsertion (before data added) = " + caretPosBeforeTextInsertion);
//        logger.debug("estimatedScrollY (before data added) = " + estimatedScrollYBeforeTextInsertion);

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

        // If the previous StreamedText object had a colour to apply when the next character was received,
        // add it now
        if(colorToApplyToNextChar != null) {
            appendColor(colorToApplyToNextChar);
            colorToApplyToNextChar = null;
        }

        String html;
        html = textToAppend.toString();
        html = html.replace("\n", "<br>");
        appendHtml(html);


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

            appendColor(streamedData.getColourMarkers().get(x).color);

            html = textToAppend.toString();
            html = html.replace("\n", "<br>");
            appendHtml(html);

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

        //===================================================//
        //= TRIM START OF DOCUMENT IF EXCEEDS BUFFER LENGTH =//
        //===================================================//

//        OptionalInt optionalInt = styledTextArea.hit(0, 10).getCharacterIndex();
//        int charAtZeroTenBeforeRemoval;
//        if(optionalInt.isPresent())
//            charAtZeroTenBeforeRemoval = optionalInt.getAsInt();
//        else
//            charAtZeroTenBeforeRemoval = 0;
//
//
//        logger.debug("charAtZeroTenBeforeRemoval = " + charAtZeroTenBeforeRemoval);
//
//        // Trim the text buffer if needed
//        // (this method will decide if required)
//        trimBufferIfRequired();
//
//        //==============================================//
//        //============== SCROLL POSITION ===============//
//        //==============================================//
//
////        logger.debug("currCharPositionInText (after data added) = " + currCharPositionInText);
////        logger.debug("caretPosition (after data added) = " + styledTextArea.getCaretPosition());
////        logger.debug("estimatedScrollY (after data added) = " + styledTextArea.getEstimatedScrollY());
//
//        switch(scrollState.get()) {
//            case FIXED_TO_BOTTOM:
//                // This moves the caret to the end of the "document"
//                currCharPositionInText = styledTextArea.getLength();
//                styledTextArea.moveTo(currCharPositionInText);
//                break;
//
//            case SMART_SCROLL:
//
//                // Scroll so that the same text is displayed in the view port
//                // as before the text insertion/removalS
//                styledTextArea.moveTo(charAtZeroTenBeforeRemoval);
//                break;
//            default:
//                throw new RuntimeException("scrollState not recognised.");
//        }

        scrollToBottom();

        return numCharsAdded;

    }

    public void clearData() {
        // Remove all text from the StyledTextArea node

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



        return numCharsToRemove;
    }

    /**
     * This should be called when the user clicks the "scroll to bottom"
     * button.
     */
    private void handleScrollToBottomButtonClicked() {
        // Change state to fixed-to-bottom

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

    private void appendHtml(String html) {
        String js = "addText(\"" + html + "\")";
        logger.debug("js = " + js);
        webEngine.executeScript(js);
    }

    private void appendColor(Color color) {
        String js = "addColor(\"" + StringUtils.toWebColor(color) + "\")";
        logger.debug("js = " + js);
        webEngine.executeScript(js);
    }

    private void scrollToBottom() {
        webEngine.executeScript("scrollToBottom()");
    }

    public class JavaBridge
    {
        private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

        public void log(String text)
        {
            logger.debug(text);
        }

        public void scrolled() {
            logger.debug("Scrolled!");
        }
    }

}
