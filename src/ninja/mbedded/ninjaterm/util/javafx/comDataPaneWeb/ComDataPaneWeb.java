package ninja.mbedded.ninjaterm.util.javafx.comDataPaneWeb;

import javafx.application.Platform;
import javafx.beans.property.SimpleBooleanProperty;
import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.scene.layout.StackPane;
import javafx.scene.paint.Color;
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
import java.util.Timer;
import java.util.TimerTask;

import static ninja.mbedded.ninjaterm.util.rxProcessing.streamedData.StreamedData.NEW_LINE_CHAR_SEQUENCE_FOR_TEXT_FLOW;


/**
 * UI node which presents COM port data to the user (can be either TX, RX, or both).
 * <p>
 * Uses a third-party <code>{@link StyledTextArea}</code> to enabled rich-text formatting
 * functionality.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @last-modified 2016-14-21
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

    private final boolean SHOW_FIREBUG = false;

    private final Color DEFAULT_COLOR = new Color(1, 1, 0, 1);

    private final int WEB_VIEW_LOAD_WAIT_TIME_MS = 2000;

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

    private int currNumChars = 0;

    private WebEngine webEngine;

    private double currScrollPos = 0;

    private SimpleBooleanProperty safeToRunScripts = new SimpleBooleanProperty(false);

    private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public ComDataPaneWeb() {

        logger.debug("ComDataPaneWeb() called. Object = " + this);

        //==============================================//
        //============== STYLESHEET SETUP ==============//
        //==============================================//

        getStylesheets().add("ninja/mbedded/ninjaterm/resources/style.css");

        //==============================================//
        //============ STYLED TEXT AREA SETUP ==========//
        //==============================================//

        webView = new WebView();
        webEngine = webView.getEngine();

        getChildren().add(webView);

        final URL mapUrl = this.getClass().getResource("richText.html");

        webEngine.javaScriptEnabledProperty().set(true);

        webEngine.load(mapUrl.toExternalForm());
        //webEngine.load("http://docs.oracle.com/javafx/2/get_started/animation.htm");

        if (safeToRunScripts.get()) {
            logger.debug("WebView has loaded page and is ready.");

            JSObject window = (JSObject) webEngine.executeScript("window");
            window.setMember("java", this);

            if (SHOW_FIREBUG)
                enableFirebug(webEngine);
            webEngine.setUserStyleSheetLocation(getClass().getResource("style.css").toString());
        } else {
            safeToRunScripts.addListener((observable, oldValue, newValue) ->
            {
                if (newValue) {
                    logger.debug("WebView has loaded page and is ready.");

                    JSObject window = (JSObject) webEngine.executeScript("window");
                    window.setMember("java", this);

                    if (SHOW_FIREBUG)
                        enableFirebug(webEngine);

                    webEngine.setUserStyleSheetLocation(getClass().getResource("style.css").toString());

                    // Call to setup defaults
                    handleScrollStateChanged();
                }
            });
        }


        //==============================================//
        //============== BUFFER SIZE SETUP =============//
        //==============================================//

        bufferSize = new SimpleIntegerProperty(DEFAULT_BUFFER_SIZE);
        bufferSize.addListener((observable, oldValue, newValue) -> {
            trimIfRequired();
        });


        //==============================================//
        //================= SCROLL SETUP ===============//
        //==============================================//

        scrollState.addListener((observable, oldValue, newValue) -> {
            handleScrollStateChanged();
        });

        //==============================================//
        //================== NAME SETUP ================//
        //==============================================//

        name.addListener((observable, oldValue, newValue) -> {
            handleNameChanged();
        });

        //==============================================//
        //================= CARET SETUP ================//
        //==============================================//

        isCaretEnabled.addListener((observable, oldValue, newValue) -> {
            handleIsCaretEnabledChange();
        });

        // This sets the current text color and the current caret color
        appendColor(DEFAULT_COLOR);

        //==============================================//
        //========= "SAFE TO RUN SCRIPTS" SETUP ========//
        //==============================================//

        Timer timer = new Timer();
        timer.schedule(new TimerTask() {
                           @Override
                           public void run() {
                               Platform.runLater(() -> {
                                   // This is hacky! This is just a simple timeout, and which point the webpage inside
                                   // WebView should have fully loaded.
                                   safeToRunScripts.set(true);
                               });
                           }
                       },
                // 1s seems to be enough to let the web page fully load
                WEB_VIEW_LOAD_WAIT_TIME_MS);

    }

    private void handleIsCaretEnabledChange() {
        if (isCaretEnabled.get()) {
            logger.debug("Showing caret...");
            runScriptWhenReady("showCaret(true)");
        } else {
            logger.debug("Hiding caret...");
            runScriptWhenReady("showCaret(false)");
        }
    }

    /**
     * Enables Firebug Lite for debugging a webEngine.
     *
     * @param engine the webEngine for which debugging is to be enabled.
     */
    private static void enableFirebug(final WebEngine engine) {
        engine.executeScript("if (!document.getElementById('FirebugLite')){E = document['createElement' + 'NS'] && document.documentElement.namespaceURI;E = E ? document['createElement' + 'NS'](E, 'script') : document['createElement']('script');E['setAttribute']('id', 'FirebugLite');E['setAttribute']('src', 'https://getfirebug.com/' + 'firebug-lite.js' + '#startOpened');E['setAttribute']('FirebugLite', '4');(document['getElementsByTagName']('head')[0] || document['getElementsByTagName']('body')[0]).appendChild(E);E = new Image;E['setAttribute']('src', 'https://getfirebug.com/' + '#startOpened');}");
    }

    private void handleNameChanged() {
        runScriptWhenReady("setName('" + name.get() + "')");
    }

    public void addData(StreamedData streamedData) {

        logger.debug("addData() called with streamedData = " + streamedData);

        //==============================================//
        //=== ADD ALL TEXT BEFORE FIRST COLOUR CHANGE ==//
        //==============================================//


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
            currNumChars += textToAppend.length();
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

        trimIfRequired();

        Integer textHeightAfterTrim = getTextHeight();
        logger.debug("textHeightAfterTrim = " + textHeightAfterTrim);


        //==============================================//
        //============== SCROLL POSITION ===============//
        //==============================================//

        switch (scrollState.get()) {
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
                if (newScrollTop < 0)
                    newScrollTop = 0;
                logger.debug("newScrollTop = " + newScrollTop);

                setComDataWrapperScrollTop(newScrollTop);

                break;
            default:
                throw new RuntimeException("scrollState not recognised.");
        }

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
     * Removes the specified number of characters from the start of the COM data displayed to the user.
     */
    private void trimIfRequired() {

        logger.debug("trimIfRequired() called.");

        if (currNumChars >= bufferSize.get()) {

            int numCharsToRemove = currNumChars - bufferSize.get();
            logger.debug("Need to trimIfRequired display text. currNumChars = " + currNumChars + ", numCharsToRemove = " + numCharsToRemove);

            webEngine.executeScript("trim(" + numCharsToRemove + ")");

            // Update the character count
            currNumChars = currNumChars - numCharsToRemove;

            logger.debug("currNumChars = " + currNumChars);
        }
    }

    /**
     * Updates the visibility of the scroll-to-bottom (the down arrow) button.
     * This should be called when <code>scrollState</code> changes.
     */
    private void handleScrollStateChanged() {
        logger.debug("handleScrollStateChanged() called.");
        switch (scrollState.get()) {
            case FIXED_TO_BOTTOM:
                runScriptWhenReady("showDownArrow(false)");
                break;
            case SMART_SCROLL:
                runScriptWhenReady("showDownArrow(true)");
                break;
            default:
                throw new RuntimeException("scrollState not recognised.");
        }
    }

    /**
     * @param script
     * @warning This is hacky! Relies on {@code safeToRunScripts}, which is set by a simple timeout.
     */
    private void runScriptWhenReady(String script) {
        logger.debug("runScriptWhenReady() called with script = " + script);

        if (safeToRunScripts.get()) {
            webEngine.executeScript(script);
        } else {
            safeToRunScripts.addListener((observable, oldValue, newValue) -> {
                if (newValue) {
                    webEngine.executeScript(script);
                }
            });

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
        //logger.debug("js = " + js);
        //webEngine.executeScript(js);
        runScriptWhenReady(js);
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
