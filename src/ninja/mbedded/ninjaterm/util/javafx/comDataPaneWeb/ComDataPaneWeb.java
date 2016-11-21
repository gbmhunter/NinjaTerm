package ninja.mbedded.ninjaterm.util.javafx.comDataPaneWeb;

import javafx.beans.property.SimpleBooleanProperty;
import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.concurrent.Worker;
import javafx.scene.layout.StackPane;
import javafx.scene.paint.Color;
import javafx.scene.text.Text;
import javafx.scene.web.WebEngine;
import javafx.scene.web.WebView;
import netscape.javascript.JSObject;
import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import ninja.mbedded.ninjaterm.util.rxProcessing.streamedData.StreamedData;
import ninja.mbedded.ninjaterm.util.stringUtils.StringUtils;
import org.apache.commons.lang3.StringEscapeUtils;
import org.fxmisc.richtext.StyledTextArea;
import org.slf4j.Logger;

import java.net.URL;

import static ninja.mbedded.ninjaterm.util.rxProcessing.streamedData.StreamedData.NEW_LINE_CHAR_SEQUENCE_FOR_TEXT_FLOW;


/**
 * UI node which presents COM port data to the user (can be either TX, RX, or both).
 * <p>
 * Uses a third-party <code>{@link StyledTextArea}</code> to enabled rich-text formatting
 * functionality.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @last-modified 2016-14-16
 * @since 2016-11-14
 */
public class ComDataPaneWeb extends StackPane {

    //================================================================================================//
    //====================================== CLASS CONSTANTS =========================================//
    //================================================================================================//

    /**
     * The default buffer size.
     */
    private final int DEFAULT_BUFFER_SIZE = 10000;

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

    public final WebView webView;

    /**
     * Variable to remember what colour to apply to the next character, since a <code>{@link StyledTextArea}</code>
     * has no way of adding a colour style to text which does not exist yet.
     */
    private Color colorToApplyToNextChar = null;

    public SimpleIntegerProperty bufferSize;

    private SimpleObjectProperty<ScrollState> scrollState = new SimpleObjectProperty<>(ScrollState.FIXED_TO_BOTTOM);

    private Text caretText;

    private int currCharPositionInText = 0;

    private int currNumChars = 0;

    private WebEngine webEngine;

    private double currScrollPos = 0;

    private boolean hasAddDataBeenCalledBefore = false;

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

            if(newValue == Worker.State.SUCCEEDED) {
                logger.debug("WebView has loaded page and is ready.");

                JSObject window = (JSObject) webEngine.executeScript("window");
                window.setMember("java", this);
                webEngine.executeScript("console.log = function(message)\n" +
                        "{\n" +
                        "    java.log(message);\n" +
                        "};");

                enableFirebug(webEngine);
                webEngine.setUserStyleSheetLocation(getClass().getResource("style.css").toString());

                // Call to setup defaults
                handleScrollStateChanged();
            }
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
//        bufferSize.addListener((observable, oldValue, newValue) -> {
//            trimBufferIfRequired();
//        });


        //==============================================//
        //================= SCROLL SETUP ===============//
        //==============================================//

        scrollState.addListener((observable, oldValue, newValue) -> {
            handleScrollStateChanged();
        });

    }

    /**
     * Enables Firebug Lite for debugging a webEngine.
     *
     * @param engine the webEngine for which debugging is to be enabled.
     */
    private static void enableFirebug(final WebEngine engine) {
        engine.executeScript("if (!document.getElementById('FirebugLite')){E = document['createElement' + 'NS'] && document.documentElement.namespaceURI;E = E ? document['createElement' + 'NS'](E, 'script') : document['createElement']('script');E['setAttribute']('id', 'FirebugLite');E['setAttribute']('src', 'https://getfirebug.com/' + 'firebug-lite.js' + '#startOpened');E['setAttribute']('FirebugLite', '4');(document['getElementsByTagName']('head')[0] || document['getElementsByTagName']('body')[0]).appendChild(E);E = new Image;E['setAttribute']('src', 'https://getfirebug.com/' + '#startOpened');}");
    }

    public void addData(StreamedData streamedData) {

        logger.debug("addData() called with streamedData = " + streamedData);

        if(!hasAddDataBeenCalledBefore) {
            appendColor(Color.GREEN);
            hasAddDataBeenCalledBefore = true;
        }

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
        if (colorToApplyToNextChar != null) {
            appendColor(colorToApplyToNextChar);
            colorToApplyToNextChar = null;
        }

        String html;
        html = textToAppend.toString();
        //html = html.replace("\n", "<br>");

        appendHtml(html);

        // Update the number of chars added with what was added to the last existing text node
        currNumChars += textToAppend.toString().length();


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
            //html = html.replace("\n", "<br>");
            appendHtml(html);

            // Update the num. chars added with all the text added to this new Text node
            //            numCharsAdded += textToAppend.length();
            currNumChars += textToAppend.length();

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


        Integer textHeightBeforeTrim = getTextHeight();

        logger.debug("textHeightBeforeTrim = " + textHeightBeforeTrim);

        if (currNumChars >= bufferSize.get()) {

            int numCharsToRemove = currNumChars - bufferSize.get();
            logger.debug("Need to trim display text. currNumChars = " + currNumChars + ", numCharsToRemove = " + numCharsToRemove);

            trim(numCharsToRemove);
            currNumChars = currNumChars - numCharsToRemove;

            logger.debug("currNumChars = " + currNumChars);

        }

        Integer textHeightAfterTrim = getTextHeight();
        logger.debug("textHeightAfterTrim = " + textHeightAfterTrim);


        //==============================================//
        //============== SCROLL POSITION ===============//
        //==============================================//

        switch(scrollState.get()) {
            case FIXED_TO_BOTTOM:
                // Scroll to the bottom
                scrollToBottom();
                break;

            case SMART_SCROLL:

                Integer heightChange = textHeightBeforeTrim - textHeightAfterTrim;
                logger.debug("heightChange = " + heightChange);

                // We need to shift the scroll up by the amount the height changed
                Integer oldScrollTop = getComDataWrapperScrollTop();
                logger.debug("oldScrollTop = " + oldScrollTop);

                Integer newScrollTop = oldScrollTop - heightChange;
                if(newScrollTop < 0)
                    newScrollTop = 0;
                logger.debug("newScrollTop = " + newScrollTop);

                setComDataWrapperScrollTop(newScrollTop);

                break;
            default:
                throw new RuntimeException("scrollState not recognised.");
        }



//        return numCharsAdded;

    }

    private Integer getComDataWrapperScrollTop() {
        return (Integer) webEngine.executeScript("getComDataWrapperScrollTop()");
    }

    private void setComDataWrapperScrollTop(Integer value) {
        webEngine.executeScript("setComDataWrapperScrollTop(" + value + ")");
    }

    public void clearData() {
        // Remove all COM data
        webEngine.executeScript("clearData()");

        // Add new default span (since all existing ones have now
        // been deleted)
        appendColor(Color.GREEN);

        // Reset scrolling
        setComDataWrapperScrollTop(0);
        currScrollPos = 0;

        // Reset character count
        currNumChars = 0;
    }

    /**
     * @return The numbers of chars removed (if any).
     * <p>
     * WARNING: If text is trimmed, this will cause the scroll position to jump to the top of the
     * document.
     */
    private void trim(int numChasToRemove) {
        logger.debug("trim() called with numChasToRemove = " + numChasToRemove);
        webEngine.executeScript("trim(" + numChasToRemove + ")");
    }

    /**
     * Updates the visibility of the scroll-to-bottom button.
     * This should be called when <code>scrollState</code> changes.
     */
    private void handleScrollStateChanged() {
        logger.debug("handleScrollStateChanged() called.");
        switch (scrollState.get()) {
            case FIXED_TO_BOTTOM:
                webEngine.executeScript("showDownArrow(false)");
                break;
            case SMART_SCROLL:
                webEngine.executeScript("showDownArrow(true)");
                break;
            default:
                throw new RuntimeException("scrollState not recognised.");
        }
    }

    private void appendHtml(String html) {

        // Return if empty string
        // (JS will throw null error)
        if (html.equals(""))
            return;

        // Escape new lines
        logger.debug("Non-escaped HTML = " + html);
        html = StringEscapeUtils.escapeJava(html);
        logger.debug("Escaped HTML = " + html);

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

    public void log(String text) {
        // Since the JavaScript will be calling this, add "JS: " to the front of the
        // messages
        logger.debug("JS: " + text);
    }

    /**
     * Called by Javascript when the user scrolls the COM data up or down
     *
     * @param scrollTop
     */
    public void scrolled(Double scrollTop) {

        logger.debug("scrolled() called. scrollTop = " + scrollTop);

        if (scrollTop >= currScrollPos) {
            currScrollPos = scrollTop;
            return;
        }

        // If the user scrolled downwards, we don't want to disable auto-scroll,
        // so check and return if so.
        if (scrollState.get() == ScrollState.SMART_SCROLL)
            return;

        logger.debug("User has scrolled upwards while in SCROLL_TO_BOTTOM mode, disabling SCROLL_TO_BOTTOM...");

        // Since the user has now scrolled upwards (manually), disable the
        // auto-scroll
        scrollState.set(ScrollState.SMART_SCROLL);

        currScrollPos = scrollTop;
    }

    public void downArrowClicked() {
        logger.debug("Down arrow clicked.");

        scrollState.set(ScrollState.FIXED_TO_BOTTOM);

        scrollToBottom();
    }

    private Integer getTextHeight() {
        return (Integer) webEngine.executeScript("getTextHeight()");
    }

}
