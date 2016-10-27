package ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx;

import javafx.animation.FadeTransition;
import javafx.animation.Timeline;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.ScrollPane;
import javafx.scene.image.ImageView;
import javafx.scene.input.KeyEvent;
import javafx.scene.input.MouseEvent;
import javafx.scene.input.ScrollEvent;
import javafx.scene.layout.Pane;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.scene.text.Text;
import javafx.scene.text.TextFlow;
import javafx.util.Duration;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.model.terminal.txRx.display.Display;
import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import ninja.mbedded.ninjaterm.util.mutable.MutableInteger;
import ninja.mbedded.ninjaterm.util.rxProcessing.streamedText.StreamedData;
import ninja.mbedded.ninjaterm.util.textNodeInList.TextNodeInList;
import ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx.colouriser.ColouriserViewController;
import ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx.display.DisplayViewController;
import ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx.filters.FiltersViewController;
import ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx.formatting.FormattingViewController;
import org.controlsfx.control.PopOver;
import org.controlsfx.glyphfont.FontAwesome;
import org.controlsfx.glyphfont.GlyphFont;
import org.slf4j.Logger;

import java.io.IOException;

/**
 * Controller for a "terminal" tab. The user can create many terminal tabs, each which
 * can open it's own COM port.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-07-16
 * @last-modified 2016-10-25
 */
public class TxRxViewController {

    /**
     * This is a fudge factor to get smart scrolling working correctly.
     */
    private final double SMART_SCROLLING_SCALE_FACTOR = 2.95;

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    public VBox dataContainerVBox;

    @FXML
    public ScrollPane rxDataScrollPane;

    @FXML
    public Label dataDirectionRxLabel;

    @FXML
    public StackPane dataDirectionRxStackPane;

    @FXML
    public TextFlow rxDataTextFlow;

    @FXML
    public StackPane txDataStackPane;

    @FXML
    public ScrollPane txTextScrollPane;

    @FXML
    public TextFlow txTextFlow;

    @FXML
    public Text txDataText;

    @FXML
    public Pane autoScrollButtonPane;

    @FXML
    public ImageView scrollToBottomImageView;

    //==============================================//
    //=========== RIGHT-HAND SIDE PANE =============//
    //==============================================//

    @FXML
    private Button clearTextButton;

    @FXML
    private Button displayButton;

    @FXML
    private Button formattingButton;

    @FXML
    private Button coloriserButton;

    @FXML
    private Button filtersButton;

    @FXML
    private Button freezeRxButton;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

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

    private Text rxDataText = new Text();

    private GlyphFont glyphFont;

    private Model model;

    /**
     * Stores the terminal model which drives this view (this is also stored in model, but it is in an array).
     */
    private Terminal terminal;

    /**
     * A Text object which holds a flashing caret. This is moved between the shared TX/RX pane and
     * the TX pane.
     */
    private Text caretText;

    private DisplayViewController displayViewController;
    private FormattingViewController formattingViewController;
    private ColouriserViewController colouriserViewController;
    private FiltersViewController filtersViewController;

    /**
     * This is used to remember how many chars are in the RX text nodes, incase we need to trim the nodes
     * due to the buffer size. This is calculated incrementaly rather than recalculated from all off the nodes
     * (which would be processor intensive)
     */
    private int numCharsInRxTextNodes = 0;

    private double heightOfOneLineOfText = 0.0;

    private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//


    public TxRxViewController() {
    }

    /**
     * Initialisation method because we are not allowed to have input parameters in the constructor.
     *
     * @param glyphFont
     */
    public void Init(Model model, Terminal terminal, GlyphFont glyphFont) {

        // Save model
        this.model = model;
        this.terminal = terminal;

        //this.comPort = comPort;
        this.glyphFont = glyphFont;


        // Remove all dummy children (which are added just for design purposes
        // in scene builder)
        rxDataTextFlow.getChildren().clear();

        // Hide the auto-scroll image-button, this will be made visible
        // when the user manually scrolls
        autoScrollButtonPane.setVisible(false);

        // Add default Text node to text flow. Received text
        // will be added to this node.
        rxDataTextFlow.getChildren().add(rxDataText);
        rxDataText.setFill(Color.LIME);

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

        // Finally, add the blinking caret as the last child in the TextFlow
        rxDataTextFlow.getChildren().add(caretText);

        // Set default opacity for scroll-to-bottom image
        scrollToBottomImageView.setOpacity(AUTO_SCROLL_BUTTON_OPACITY_NON_HOVER);

        //==============================================//
        //==== AUTO-SCROLL RELATED EVENT HANDLERS ======//
        //==============================================//

        // This adds a listener which will implement the "auto-scroll" functionality
        // when it is enabled with @link{autoScrollEnabled}.
        rxDataTextFlow.heightProperty().addListener((observable, oldValue, newValue) -> {
            //logger.debug("heightProperty changed to " + newValue);

            if (terminal.txRx.autoScrollEnabled.get()) {
                rxDataScrollPane.setVvalue(rxDataTextFlow.getHeight());
            }

        });

        rxDataScrollPane.addEventFilter(ScrollEvent.ANY, event -> {

            // If the user scrolled downwards, we don't want to disable auto-scroll,
            // so check and return if so.
            if (event.getDeltaY() <= 0)
                return;

            // Since the user has now scrolled upwards (manually), disable the
            // auto-scroll
            terminal.txRx.autoScrollEnabled.set(false);

            autoScrollButtonPane.setVisible(true);
        });

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

                    // Enable auto-scroll
                    terminal.txRx.autoScrollEnabled.set(true);

                    // Hide the auto-scroll button. This is made visible again when the user
                    // manually scrolls.
                    autoScrollButtonPane.setVisible(false);

                    // Manually perform one auto-scroll, since the next automatic one won't happen until
                    // the height of rxDataTextFlow changes.
                    rxDataScrollPane.setVvalue(rxDataTextFlow.getHeight());
                }
        );

        //==============================================//
        //========== CLEAR TEXT BUTTON SETUP ===========//
        //==============================================//

        clearTextButton.setGraphic(glyphFont.create(FontAwesome.Glyph.ERASER));

        clearTextButton.setOnAction(event -> {
            logger.debug("clearTextButton clicked.");
            terminal.txRx.clearTxAndRxData();
            model.status.addMsg("Terminal TX/RX text cleared.");
        });

        terminal.txRx.rxDataClearedListeners.add(() -> {
            // Clear children from the RX text flow, this should empty
            // all data from the RX pane
            rxDataTextFlow.getChildren().remove(0, rxDataTextFlow.getChildren().size() - 1);
            //rxDataTextFlow.getChildren().add(new Text());
            Text lastRemainingTextNode = (Text) rxDataTextFlow.getChildren().get(0);
            lastRemainingTextNode.setText("");

            // Reset the variable which counts the number of RX chars
            numCharsInRxTextNodes = 0;
        });

        //==============================================//
        //======= DISPLAY BUTTON/POP-OVER SETUP ========//
        //==============================================//

        displayButton.setGraphic(glyphFont.create(FontAwesome.Glyph.ARROWS));

        FXMLLoader loader = new FXMLLoader(getClass().getResource("display/DisplayView.fxml"));
        try {
            loader.load();
        } catch (IOException e) {
            return;
        }
        displayViewController = loader.getController();

        displayViewController.init(model, terminal);

        setupPopover(loader.getRoot(), "Display", displayButton);

        //==============================================//
        //===== FORMATTING BUTTON/POP-OVER SETUP =======//
        //==============================================//

        formattingButton.setGraphic(glyphFont.create(FontAwesome.Glyph.CUBES));

        loader = new FXMLLoader(getClass().getResource("formatting/FormattingView.fxml"));
        try {
            loader.load();
        } catch (IOException e) {
            return;
        }
        formattingViewController = loader.getController();

        formattingViewController.init(model, terminal);

        setupPopover(loader.getRoot(), "Formatting", formattingButton);

        //==============================================//
        //========== COLOURISER BUTTON SETUP ===========//
        //==============================================//

        coloriserButton.setGraphic(glyphFont.create(FontAwesome.Glyph.PAINT_BRUSH));

        loader = new FXMLLoader(getClass().getResource("colouriser/ColouriserView.fxml"));
        try {
            loader.load();
        } catch (IOException e) {
            return;
        }
        colouriserViewController = loader.getController();

        colouriserViewController.init(model, terminal);

        setupPopover(loader.getRoot(), "Colouriser", coloriserButton);

        //==============================================//
        //============ FILTERS BUTTON SETUP ============//
        //==============================================//

        filtersButton.setGraphic(glyphFont.create(FontAwesome.Glyph.FILTER));

        loader = new FXMLLoader(getClass().getResource("filters/FiltersView.fxml"));
        try {
            loader.load();
        } catch (IOException e) {
            return;
        }
        filtersViewController = loader.getController();

        filtersViewController.init(model, terminal);

        setupPopover(loader.getRoot(), "Filters", filtersButton);

        //==============================================//
        //=========== FREEZE RX BUTTON SETUP ===========//
        //==============================================//

        freezeRxButton.setOnAction(event -> {
            if (!terminal.txRx.rxDataEngine.isFrozen.get()) {
                terminal.txRx.freezeRx();
            } else {
                terminal.txRx.unFreezeRx();
            }
        });

        terminal.txRx.rxDataEngine.isFrozen.addListener((observable, oldValue, newValue) -> {
            refreshFreezeRxButton();
        });

        // Set to default, should update button appropriately
        refreshFreezeRxButton();

        //==============================================//
        //== ATTACH LISTENERS TO WRAPPING PROPERTIES ===//
        //==============================================//
        terminal.txRx.display.wrappingEnabled.addListener((observable, oldValue, newValue) -> {
            updateTextWrapping();
        });

        terminal.txRx.display.wrappingWidth.addListener((observable, oldValue, newValue) -> {
            updateTextWrapping();
        });

        // Update to default wrapping values in model
        updateTextWrapping();

        //==============================================//
        //========== ATTACH LISTENER TO LAYOUT =========//
        //==============================================//

        terminal.txRx.display.selLayoutOption.addListener((observable, oldValue, newValue) -> {
            logger.debug("Selected layout option has been changed.");
            updateLayout();
        });

        //==============================================//
        //======= BIND TERMINAL TEXT TO TXRX DATA ======//
        //==============================================//

        //rxDataText.textProperty().bind(terminal.txRx.filteredRxData);

        // Setting the models ObservableList of nodes to point to the
        // children of the RX data TextFlow will allow the textflow
        // to get updated automatically when the model modifies this
        // ObservableList
        //terminal.txRx.rxDataAsList = rxDataTextFlow.getChildren();
        terminal.txRx.rxDataEngine.newOutputListeners.add(streamedText -> {
            newStreamedTextListener(streamedText);
        });

        txDataText.textProperty().bind(terminal.txRx.txData);

        // Call this to update the display of the TX/RX pane into its default
        // state
        updateLayout();

        //==============================================//
        //============= SETUP TX AUTO-SCROLL ===========//
        //==============================================//

        txTextFlow.heightProperty().addListener((observable, oldValue, newValue) -> {
            txTextScrollPane.setVvalue(txTextFlow.getHeight());
        });

        //==============================================//
        //========== SETUP RX DIRECTION TEXT ===========//
        //==============================================//

        terminal.txRx.display.localTxEcho.addListener((observable, oldValue, newValue) -> {
            updateDataDirectionText();
        });

        // The following code was meant to resize the RX direction indicator region
        // to always just fit the child text, but...
        // I COULD NOT GET THIS TO WORK CORRECTLY!!!
        /*dataDirectionRxLabel.widthProperty().addListener((observable, oldValue, newValue) -> {
            double newWidth = newValue.doubleValue() + 100.0;

            logger.debug("newWidth = " + newWidth);
            dataDirectionRxStackPane.setMinWidth(newWidth);
            dataDirectionRxStackPane.setMaxWidth(newWidth);
        });*/

        //==============================================//
        //=== WORK OUT THE HEIGHT OF ONE LINE OF TEXT ==//
        //==============================================//

        recalcHeightOfOneLine();
    }

    private void refreshFreezeRxButton() {
        if (!terminal.txRx.rxDataEngine.isFrozen.get()) {
            freezeRxButton.setText("Freeze RX");
            freezeRxButton.setGraphic(glyphFont.create(FontAwesome.Glyph.LOCK));
        } else {
            freezeRxButton.setText("Un-freeze RX");
            freezeRxButton.setGraphic(glyphFont.create(FontAwesome.Glyph.UNLOCK));
        }

    }

    /**
     * This listener updates the UI with "streamed" RX data. The model is responsible
     * for calling the listener after RX data has been received and processed.
     *
     * @param streamedData
     */
    private void newStreamedTextListener(StreamedData streamedData) {

        logger.debug("newStreamedTextListener() called with streamedData = " + streamedData);

        // This here forces the RX pane to perform layout of it's child nodes, which means that all
        // layout dimensions will be valid.
        rxDataTextFlow.layout();
        double rxDataTextFlowHeightBeforeTrimming = rxDataTextFlow.getHeight();
        logger.debug("rxDataTextFlowHeightBeforeTrimming = " + rxDataTextFlowHeightBeforeTrimming);
        ObservableList<Node> observableList = rxDataTextFlow.getChildren();


        //==============================================//
        //=============== INSERT NEW TEXT ==============//
        //==============================================//

        // This old method was buggy, because it didn't take into account the new line characters!
        //numCharsInRxTextNodes += streamedData.getText().length();

        MutableInteger numCharsAdded = new MutableInteger(0);

        // Move all text/colour info provided in this streamed text object into the
        // Text nodes that make up the RX data view
        switch (terminal.txRx.display.selLayoutOption.get()) {
            case SINGLE_PANE:
                streamedData.shiftToTextNodes(observableList, observableList.size() - 1, numCharsAdded);
                break;
            case SEPARATE_TX_RX:
                streamedData.shiftToTextNodes(observableList, observableList.size(), numCharsAdded);
                break;
            default:
                throw new RuntimeException("selLayoutOption not recognised.");
        }

        numCharsInRxTextNodes += numCharsAdded.intValue();

        //==============================================//
        //==================== TRIMMING ================//
        //==============================================//


        // Trim RX UI if necessary
        // (the ANSI parser output data is trimmed separately in the model)
        if (numCharsInRxTextNodes > terminal.txRx.display.bufferSizeChars.get()) {
            logger.debug("Trimming data in RX pane. numCharsInRxTextNodes = " + Integer.toString(numCharsInRxTextNodes));
            int numCharsToRemove = numCharsInRxTextNodes - terminal.txRx.display.bufferSizeChars.get();
            MutableInteger numNewLinesRemoved = new MutableInteger(0);
            TextNodeInList.trimTextNodesFromStart(observableList, numCharsToRemove, numNewLinesRemoved);

            // Perform smart scrolling only if enabled
            if(terminal.txRx.display.scrollBehaviour.get() == Display.ScrollBehaviour.SMART)
                smartScroll(numNewLinesRemoved, rxDataTextFlowHeightBeforeTrimming);

            // Now we have removed chars, update the count
            numCharsInRxTextNodes -= numCharsToRemove;
            logger.debug("After trim, numCharsInRxTextNodes = " + Integer.toString(numCharsInRxTextNodes));
        }

    }

    /**
     * Scrolls the RX pane so that the same text is visible after trimming.
     *
     * Should be called straight after trimming, and only if smart scrolling is enabled.
     *
     * @param numNewLinesRemoved    The number of new lines that were just removed in the trimming operation.
     * @param rxDataTextFlowHeightBeforeTrimming    The height (in pixels) of the RX TextFlow object before the trimming operation.
     */
    private void smartScroll(MutableInteger numNewLinesRemoved, double rxDataTextFlowHeightBeforeTrimming) {
        //==============================================//
        //=============== SMART SCROLLING ==============//
        //==============================================//

        rxDataTextFlow.requestLayout();
        double rxDataTextFlowHeightAfterTrimming = rxDataTextFlow.getHeight();
        logger.debug("rxDataTextFlowHeightAfterTrimming = " + rxDataTextFlowHeightAfterTrimming);

        double rxDataTextFlowHeightChange = rxDataTextFlowHeightAfterTrimming - rxDataTextFlowHeightBeforeTrimming;
        logger.debug("rxDataTextFlowHeightChange = " + rxDataTextFlowHeightChange);

        if(rxDataTextFlowHeightChange != 0.0) {
            throw new RuntimeException("The RX data TextFlow object changed height after trimming text. This scenario is not supported by smart scroll.");
        }

        logger.debug("numNewLinesRemoved = " + numNewLinesRemoved.intValue());

        // Update the scroll position of the RX pane
        if (!terminal.txRx.autoScrollEnabled.get()) {
            // Auto-scroll is not enabled, so we want to display the same text in the pane as
            // before
            double absAmountToShiftBy = -1*numNewLinesRemoved.intValue()*heightOfOneLineOfText;
            //absAmountToShiftBy -= 40.0;

            logger.debug("absAmountToShiftBy = " + absAmountToShiftBy);

            double percAmountToShiftBy;
            if(rxDataTextFlow.getHeight() > rxDataScrollPane.getHeight()) {
                // We have to subtract of the height of the scroll pane, as the 0 to 1 percentage
                // that sets the current position of the scroll pane does not take into account the
                // last section of the TextFlow object (this is normally how scroll panes work)
                percAmountToShiftBy =
                        absAmountToShiftBy /
                                // I don't know if  rxDataTextFlow.getPadding().getTop() should be here, but it seems
                                // to make the scrolling "almost" perfect
                                (rxDataTextFlow.getHeight() + rxDataTextFlow.getPadding().getTop() -
                                        (rxDataScrollPane.getHeight() - rxDataScrollPane.getPadding().getTop() - rxDataScrollPane.getPadding().getBottom()));
            } else {
                // If the TextFlow object is smaller than the scroll pane, don't do any adjustment to the
                // scrolling at all
                percAmountToShiftBy = 0.0;
            }
            logger.debug("percAmountToShiftBy = " + percAmountToShiftBy);

            // Adjust the scrolling
            rxDataScrollPane.setVvalue(rxDataScrollPane.getVvalue() + percAmountToShiftBy);
        }
    }

    /**
     * Helper method to attach a pop-over to a button (so it appears/disappears when you
     * click the button).
     *
     * @param content
     * @param popOverTitle
     * @param buttonToAttachTo
     */
    private void setupPopover(Node content, String popOverTitle, Button buttonToAttachTo) {

        // This creates the popover, but is not shown until
        // show() is called.
        PopOver popover = new PopOver();
        popover.setContentNode(content);
        popover.setArrowLocation(PopOver.ArrowLocation.RIGHT_CENTER);
        popover.setCornerRadius(4);
        popover.setTitle(popOverTitle);

        buttonToAttachTo.setOnAction(event -> {

            if (popover.isShowing()) {
                popover.hide();
            } else if (!popover.isShowing()) {
                showPopover(buttonToAttachTo, popover);
            } else {
                new RuntimeException("isShowing() state not recognised.");
            }
        });
    }

    /**
     * Updates the text wrapping to the current user-selected settings.
     * Called from both the checkbox and wrapping width textfield listeners.
     */
    private void updateTextWrapping() {

        if (terminal.txRx.display.wrappingEnabled.get()) {
            logger.debug("\"Wrapping\" checkbox is currently checked, applying wrapping value.");

            // Set the width of the TextFlow UI object. This will set the wrapping width
            // (there is no wrapping object)
            rxDataTextFlow.setMaxWidth(terminal.txRx.display.wrappingWidth.get());

        } else {
            logger.debug("\"Wrapping\" checkbox is current unchecked, not apply wrapping value.");
            rxDataTextFlow.setMaxWidth(Double.MAX_VALUE);
        }
    }


    public void showPopover(Button button, PopOver popOver) {

        logger.debug(".showPopover() called.");

        //==============================================//
        //=============== DECODING POPOVER =============//
        //==============================================//

        double clickX = button.localToScreen(button.getBoundsInLocal()).getMinX();
        double clickY = (button.localToScreen(button.getBoundsInLocal()).getMinY() +
                button.localToScreen(button.getBoundsInLocal()).getMaxY()) / 2;

        popOver.show(button.getScene().getWindow());
        popOver.setX(clickX - popOver.getWidth());
        popOver.setY(clickY - popOver.getHeight() / 2);
    }

    private void updateDataDirectionText() {
        if (terminal.txRx.display.localTxEcho.get()) {
            dataDirectionRxLabel.setText("RX + TX echo");
        } else {
            dataDirectionRxLabel.setText("RX");
        }
    }

    /**
     * Updates the layout of the TX/RX tab based on the layout option selected
     * in the model.
     */
    public void updateLayout() {
        switch (terminal.txRx.display.selLayoutOption.get()) {
            case SINGLE_PANE:

                // Hide TX pane

                //txTextFlow.setMinHeight(0.0);
                //txTextFlow.setMaxHeight(0.0);
                if (dataContainerVBox.getChildren().contains(txDataStackPane)) {
                    dataContainerVBox.getChildren().remove(txDataStackPane);
                }

                // Add the caret in the shared pane
                if (!rxDataTextFlow.getChildren().contains(caretText)) {
                    rxDataTextFlow.getChildren().add(caretText);
                }

                break;
            case SEPARATE_TX_RX:

                // Show TX pane
                //txTextFlow.setMinHeight(100.0);
                //txTextFlow.setMaxHeight(100.0);
                if (!dataContainerVBox.getChildren().contains(txDataStackPane)) {
                    dataContainerVBox.getChildren().add(txDataStackPane);
                }

                // Remove the caret in the shared pane
                if (rxDataTextFlow.getChildren().contains(caretText)) {
                    rxDataTextFlow.getChildren().remove(caretText);
                }

                // Add the caret to the TX pane
                if (!txTextFlow.getChildren().contains(caretText)) {
                    txTextFlow.getChildren().add(caretText);
                }

                break;
            default:
                throw new RuntimeException("selLayoutOption unrecognised!");
        }
    }

    public void handleKeyTyped(KeyEvent keyEvent) {

        terminal.txRx.handleKeyPressed((byte) keyEvent.getCharacter().charAt(0));
    }

    private void recalcHeightOfOneLine() {

        TextFlow textFlow = new TextFlow();

        Text text = new Text();
        textFlow.getChildren().add(text);

        text.setText("1");
        double positionOfLine1 = text.getBoundsInParent().getMaxY();

        text.setText("1\n2");
        double positionOfLine2 = text.getBoundsInParent().getMaxY();

        text.setText("1\n2\n3");
        double positionOfLine3 = text.getBoundsInParent().getMaxY();

        double heightBetween1And2 = positionOfLine2 - positionOfLine1;
        double heightBetween2And3 = positionOfLine2 - positionOfLine1;

        if(heightBetween1And2 != heightBetween2And3)
            throw new RuntimeException("The heights of the lines of text are not the same.");

        //heightOfOneLineOfText = heightBetween1And2;

        // @debug
        heightOfOneLineOfText = 16.0;

    }

    private void convertHeightToPercentageFromScrollView() {

    }
}
