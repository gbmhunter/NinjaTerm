package ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx;

import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.value.ChangeListener;
import javafx.event.EventHandler;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Cursor;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.Control;
import javafx.scene.input.KeyEvent;
import javafx.scene.input.MouseEvent;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.HBox;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.util.javafx.comDataPaneWeb.ComDataPaneWeb;
import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx.colouriser.ColouriserViewController;
import ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx.display.DisplayViewController;
import ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx.filters.FiltersViewController;
import ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx.formatting.FormattingViewController;
import ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx.macros.MacrosViewController;
import org.controlsfx.control.PopOver;
import org.controlsfx.glyphfont.FontAwesome;
import org.controlsfx.glyphfont.GlyphFont;
import org.slf4j.Logger;

import java.io.IOException;
import java.util.Observable;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Controller for a "terminal" tab. The user can create many terminal tabs, each which
 * can open it's own COM port.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @last-modified 2017-02-20
 * @since 2016-07-16
 */
public class TxRxViewController {

    //================================================================================================//
    //========================================= CLASS CONSTANS =======================================//
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

    /**
     * The default amount of screen space given to the TX vs. the RX data panes.
     * Normally, you would want more screen space for the RX data.
     */
    private static final double DEFAULT_RX_TO_TX_VIEW_RATIO = 0.8;

    private static final double MIN_HEIGHT_OF_TX_OR_RX_PANE_PX = 40.0;

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    private GridPane dataContainerGridPane;

    @FXML
    private ComDataPaneWeb rxComDataPane;

    @FXML
    private HBox draggableHBox;

    @FXML
    private ComDataPaneWeb txComDataPane;

    //==============================================//
    //============ LEFT-HAND SIDE PANE =============//
    //==============================================//

    @FXML
    public Button openCloseComPortButton;

    @FXML
    private Button clearTextButton;

//    @FXML
//    private Button displayButton;

//    @FXML
//    private Button formattingButton;

//    @FXML
//    private Button coloriserButton;

//    @FXML
//    private Button filtersButton;

    @FXML
    private Button freezeRxButton;

    //==============================================//
    //======== RIGHT-HAND SIDE MACROS PANE =========//
    //==============================================//

    @FXML
    private MacrosViewController macrosViewController;

    @FXML
    private FiltersViewController filtersViewController;

    @FXML
    private DisplayViewController displayViewController;

    @FXML
    private FormattingViewController formattingViewController;

    @FXML
    private ColouriserViewController colouriserViewController;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    private GlyphFont glyphFont;

    private Model model;

    /**
     * Stores the terminal model which drives this view (this is also stored in model, but it is in an array).
     */
    private Terminal terminal;

//    private DisplayViewController displayViewController;
//    private FormattingViewController formattingViewController;
//    private ColouriserViewController colouriserViewController;
//    private FiltersViewController filtersViewController;

    private SimpleIntegerProperty webViewLoadCount = new SimpleIntegerProperty(0);

    private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

    private double currTxRxViewRatio = DEFAULT_RX_TO_TX_VIEW_RATIO;

    private ChangeListener<? super Boolean> openCloseChangeListener;

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


        //==============================================//
        //====== OPEN/CLOSE COM PORT BUTTON SETUP ======//
        //==============================================//

        openCloseComPortButton.setGraphic(glyphFont.create(FontAwesome.Glyph.PLAY));
        openCloseComPortButton.setText("Open");

        openCloseComPortButton.setOnAction(event -> {
            model.openOrCloseCurrentComPort();
        });

        // Create a listener which refreshes the open/close COM port button
        openCloseChangeListener = (observable, oldValue, newValue) -> {
            refreshOpenCloseButton();
        };

        model.selTerminal.addListener((observable, oldValue, newValue) -> {

            if (oldValue != null) {
                oldValue.isComPortOpen.removeListener(openCloseChangeListener);
            }

            newValue.isComPortOpen.addListener(openCloseChangeListener);

            // Refresh the style of the open/close COM port button when the selected
            // terminal changes (i.e. when the user selects a different terminal tab)
            refreshOpenCloseButton();
        });

        // Attach handler for when selected COM port changes. This is responsible for
        // enabling/disabling the "Open" button as appropriate
        terminal.comPortSettings.selComPortName.addListener(
                (observable, oldValue, newValue) -> {

                    // newValue will be null if a scan was done and no COM ports
                    // were found
                    if (newValue == null) {
                        openCloseComPortButton.setDisable(true);
                    } else {
                        openCloseComPortButton.setDisable(false);
                    }
                });

        //==============================================//
        //========== CLEAR TEXT BUTTON SETUP ===========//
        //==============================================//

        clearTextButton.setGraphic(glyphFont.create(FontAwesome.Glyph.ERASER));

        clearTextButton.setOnAction(event -> {
            logger.debug("clearTextButton clicked.");
            terminal.txRx.clearTxAndRxData();
        });

        terminal.txRx.txDataClearedListeners.add(() -> {
            txComDataPane.clearData();
        });

        terminal.txRx.rxDataClearedListeners.add(() -> {
            rxComDataPane.clearData();
        });

        //==============================================//
        //======= DISPLAY BUTTON/POP-OVER SETUP ========//
        //==============================================//

//        displayButton.setGraphic(glyphFont.create(FontAwesome.Glyph.ARROWS));
//
//        FXMLLoader loader = new FXMLLoader(getClass().getResource("display/DisplayView.fxml"));
//        try {
//            loader.load();
//        } catch (IOException e) {
//            return;
//        }
//        displayViewController = loader.getController();

        displayViewController.init(model, terminal);

//        setupPopover(loader.getRoot(), "Display", displayButton);

        //==============================================//
        //===== FORMATTING BUTTON/POP-OVER SETUP =======//
        //==============================================//

//        formattingButton.setGraphic(glyphFont.create(FontAwesome.Glyph.CUBES));

        FXMLLoader loader;
//        loader = new FXMLLoader(getClass().getResource("formatting/FormattingView.fxml"));
//        try {
//            loader.load();
//        } catch (IOException e) {
//            return;
//        }
//        formattingViewController = loader.getController();

        formattingViewController.init(model, terminal);

//        setupPopover(loader.getRoot(), "Formatting", formattingButton);

        //==============================================//
        //========== COLOURISER BUTTON SETUP ===========//
        //==============================================//

//        coloriserButton.setGraphic(glyphFont.create(FontAwesome.Glyph.PAINT_BRUSH));
//
//        loader = new FXMLLoader(getClass().getResource("colouriser/ColouriserView.fxml"));
//        try {
//            loader.load();
//        } catch (IOException e) {
//            return;
//        }
//        colouriserViewController = loader.getController();

        colouriserViewController.init(model, terminal);

//        setupPopover(loader.getRoot(), "Colouriser", coloriserButton);

        //==============================================//
        //============ FILTERS BUTTON SETUP ============//
        //==============================================//

//        filtersButton.setGraphic(glyphFont.create(FontAwesome.Glyph.FILTER));

//        loader = new FXMLLoader(getClass().getResource("filters/FiltersView.fxml"));
//        try {
//            loader.load();
//        } catch (IOException e) {
//            return;
//        }
//        filtersViewController = loader.getController();

        filtersViewController.init(model, terminal);

//        setupPopover(loader.getRoot(), "Filters", filtersButton);

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
            //updateTextWrapping();
        });

        terminal.txRx.display.wrappingWidth.addListener((observable, oldValue, newValue) -> {
            //updateTextWrapping();
        });

        //==============================================//
        //========== ATTACH LISTENER TO LAYOUT =========//
        //==============================================//

        terminal.txRx.display.selLayoutOption.addListener((observable, oldValue, newValue) -> {
            logger.debug("Selected layout option has been changed.");
            updateTxRxPaneLayout();
        });

        updateTxRxPaneLayout();

        //==============================================//
        //============== SETUP RX DATA PANE ============//
        //==============================================//

//        rxComDataPane.webViewLoaded.addListener((observable, oldValue, newValue) -> {
//            handleWebViewLoaded();
//        });

        // Add a listener for the new ComDataPane object
        terminal.txRx.rxDataEngine.newOutputListeners.add(streamedData -> {
            rxComDataPane.addData(streamedData);
        });

        rxComDataPane.bufferSize.bind(terminal.txRx.display.bufferSizeChars);

        // Bind to stats
        rxComDataPane.currNumChars.addListener((observable, oldValue, newValue) -> {
            terminal.stats.numCharsInRxDisplayBuffer.set(newValue.intValue());
        });
        terminal.stats.numCharsInRxDisplayBuffer.set(rxComDataPane.currNumChars.intValue());

        // WRAPPING ENABLED
        terminal.txRx.display.wrappingEnabled.addListener((observable, oldValue, newValue) -> {
            rxComDataPane.setWrappingEnabled(newValue);
        });
        rxComDataPane.setWrappingEnabled(terminal.txRx.display.wrappingEnabled.get());

        // WRAPPING WIDTH
        terminal.txRx.display.wrappingWidth.addListener((observable, oldValue, newValue) -> {
            rxComDataPane.setWrappingWidthPx(newValue.doubleValue());
        });
        rxComDataPane.setWrappingWidthPx(terminal.txRx.display.wrappingWidth.doubleValue());


        //==============================================//
        //============== SETUP TX DATA PANE ============//
        //==============================================//

//        txComDataPane.webViewLoaded.addListener((observable, oldValue, newValue) -> {
//            handleWebViewLoaded();
//        });

        terminal.txRx.txDataToDisplayListeners.add(streamedData -> {
            txComDataPane.addData(streamedData);
        });

        txComDataPane.bufferSize.bind(terminal.txRx.display.bufferSizeChars);

        // Bind to stats
        txComDataPane.currNumChars.addListener((observable, oldValue, newValue) -> {
            terminal.stats.numCharsInTxDisplayBuffer.set(newValue.intValue());
        });
        terminal.stats.numCharsInTxDisplayBuffer.set(txComDataPane.currNumChars.intValue());

        // WRAPPING ENABLED
        terminal.txRx.display.wrappingEnabled.addListener((observable, oldValue, newValue) -> {
            txComDataPane.setWrappingEnabled(newValue);
        });
        txComDataPane.setWrappingEnabled(terminal.txRx.display.wrappingEnabled.get());

        // WRAPPING WIDTH
        terminal.txRx.display.wrappingWidth.addListener((observable, oldValue, newValue) -> {
            txComDataPane.setWrappingWidthPx(newValue.doubleValue());
        });
        txComDataPane.setWrappingWidthPx(terminal.txRx.display.wrappingWidth.doubleValue());

        // Call this to update the display of the TX/RX pane into its default
        // state
        updateTxRxPaneLayout();

        //==============================================//
        //============ SETUP DIRECTION TEXT ============//
        //==============================================//

        terminal.txRx.display.localTxEcho.addListener((observable, oldValue, newValue) -> {
            updateDataDirectionText();
        });

        updateDataDirectionText();

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

        //recalcHeightOfOneLine();

        //==============================================//
        //============ SETUP DRAGGABLE HBOX ============//
        //==============================================//

        draggableHBox.setOnMousePressed(draggableHBoxOnMousePressedEventHandler);
        draggableHBox.setOnMouseDragged(draggableHBoxOnMouseDraggedEventHandler);

        // Cause the mouse cursor to change to a vertical resize icon when over
        // the draggable HBox
        draggableHBox.setCursor(Cursor.V_RESIZE);

        //==============================================//
        //================ MACROS SETUP ================//
        //==============================================//

        macrosViewController.init(model, terminal, glyphFont);

        //! @debug
        dataContainerGridPane.heightProperty().addListener((observable, oldValue, newValue) -> {
            resizeTxRxPanes();
        });

    }

//    private void handleWebViewLoaded() {
//        if(rxComDataPane.webViewLoaded.get() && txComDataPane.webViewLoaded.get()) {
//            logger.debug("Both web views have loaded, it is safe to run scripts...");
//            rxComDataPane.safeToRunScripts.set(true);
//            txComDataPane.safeToRunScripts.set(true);
//        }
//    }

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
     * This updates the styling of the Open/Close COM port button based on whether the
     * terminal in the model has an open or closed COM port.
     */
    private void refreshOpenCloseButton() {
        if (!terminal.isComPortOpen.get()) {
            openCloseComPortButton.setGraphic(glyphFont.create(FontAwesome.Glyph.PLAY));
            openCloseComPortButton.setText("Open");
            openCloseComPortButton.getStyleClass().remove("failure");
            openCloseComPortButton.getStyleClass().add("success");
        } else {
            openCloseComPortButton.setGraphic(glyphFont.create(FontAwesome.Glyph.STOP));
            openCloseComPortButton.setText("Close");
            openCloseComPortButton.getStyleClass().remove("success");
            openCloseComPortButton.getStyleClass().add("failure");
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
        popover.setArrowLocation(PopOver.ArrowLocation.LEFT_CENTER);
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
    /*private void updateTextWrapping() {

        if (terminal.txRx.display.wrappingEnabled.get()) {
            logger.debug("\"Wrapping\" checkbox is currently checked, applying wrapping value.");

            // Set the width of the TextFlow UI object. This will set the wrapping width
            // (there is no wrapping object)
            rxDataTextFlow.setMaxWidth(terminal.txRx.display.wrappingWidth.get());

        } else {
            logger.debug("\"Wrapping\" checkbox is current unchecked, not apply wrapping value.");
            rxDataTextFlow.setMaxWidth(Double.MAX_VALUE);
        }
    }*/
    public void showPopover(Button button, PopOver popOver) {

        logger.debug(".showPopover() called.");

        //==============================================//
        //=============== DECODING POPOVER =============//
        //==============================================//

        double clickX = button.localToScreen(button.getBoundsInLocal()).getMinX();
        double clickY = (button.localToScreen(button.getBoundsInLocal()).getMinY() +
                button.localToScreen(button.getBoundsInLocal()).getMaxY()) / 2;

        popOver.show(button.getScene().getWindow());
        // Show on left
//        popOver.setX(clickX - popOver.getWidth());
//        popOver.setY(clickY - popOver.getHeight() / 2);
        // Show on right
        popOver.setX(clickX + 40.0);
        popOver.setY(clickY - popOver.getHeight() / 2);
    }

    private void updateDataDirectionText() {
        if (terminal.txRx.display.localTxEcho.get()) {
            rxComDataPane.name.set("RX + TX echo");
        } else {
            rxComDataPane.name.set("RX");
        }

        // This is always going to say "TX"
        txComDataPane.name.set("TX");
    }

    /**
     * Updates the layout of the TX/RX panes based on the layout option selected
     * in the model.
     */
    public void updateTxRxPaneLayout() {
        switch (terminal.txRx.display.selLayoutOption.get()) {
            case SINGLE_PANE:

                // Hide TX ComDataPane
                if (dataContainerGridPane.getChildren().contains(txComDataPane)) {
                    dataContainerGridPane.getChildren().remove(txComDataPane);
                }

                if (dataContainerGridPane.getChildren().contains(draggableHBox)) {
                    dataContainerGridPane.getChildren().remove(draggableHBox);
                }

                // Let the first row grow to max. height, and max the 2 and 3rd rows disappear (no height)
                dataContainerGridPane.getRowConstraints().get(0).setMaxHeight(Control.USE_COMPUTED_SIZE);
                dataContainerGridPane.getRowConstraints().get(1).setMaxHeight(0.0);
                dataContainerGridPane.getRowConstraints().get(2).setMaxHeight(0.0);

                // Add the caret in the shared pane
                rxComDataPane.isCaretEnabled.set(true);
                txComDataPane.isCaretEnabled.set(false);

                break;
            case SEPARATE_TX_RX:

                // Show TX pane
                if (!dataContainerGridPane.getChildren().contains(txComDataPane)) {
                    dataContainerGridPane.getChildren().add(txComDataPane);
                }

                if (!dataContainerGridPane.getChildren().contains(draggableHBox)) {
                    dataContainerGridPane.getChildren().add(draggableHBox);
                }

                // Let the first row grow to max. height, and max the 2 and 3rd rows disappear (no height)
                dataContainerGridPane.getRowConstraints().get(0).setMaxHeight(Control.USE_COMPUTED_SIZE);
                dataContainerGridPane.getRowConstraints().get(1).setMaxHeight(Control.USE_COMPUTED_SIZE);
                dataContainerGridPane.getRowConstraints().get(2).setMaxHeight(Control.USE_COMPUTED_SIZE);

                // Add the caret in the TX pane
                rxComDataPane.isCaretEnabled.set(false);
                txComDataPane.isCaretEnabled.set(true);

                // Force a resize, this will take the old ratio into account
                // from last time we were in this state
                resizeTxRxPanes();

                break;
            default:
                throw new RuntimeException("selLayoutOption unrecognised!");
        }
    }

    public void handleKeyTyped(KeyEvent keyEvent) {
        terminal.txRx.handleKeyPressed(keyEvent);
    }

    private double orgSceneY;
    private double orgRxDataStackPaneHeight;

    EventHandler<MouseEvent> draggableHBoxOnMousePressedEventHandler =
            new EventHandler<MouseEvent>() {

                @Override
                public void handle(MouseEvent t) {
                    logger.debug("Event handler for onMousePressed called.");

                    orgSceneY = t.getSceneY();

                    orgRxDataStackPaneHeight = rxComDataPane.getHeight();
                }
            };

    EventHandler<MouseEvent> draggableHBoxOnMouseDraggedEventHandler =
            new EventHandler<MouseEvent>() {

                @Override
                public void handle(MouseEvent t) {

                    double offsetY = t.getSceneY() - orgSceneY;

                    double newRxDataStackPaneHeight = orgRxDataStackPaneHeight + offsetY;

                    //=========== MIN LIMIT ===========//
                    if (newRxDataStackPaneHeight < MIN_HEIGHT_OF_TX_OR_RX_PANE_PX)
                        newRxDataStackPaneHeight = MIN_HEIGHT_OF_TX_OR_RX_PANE_PX;

                    //=========== MAX LIMIT ===========//

                    // We don't want the RX pane to ever be larger than the height of it's
                    // parent container, minus the height of the draggable HBox
                    double maxHeight = dataContainerGridPane.getHeight() - draggableHBox.getHeight();
                    if (newRxDataStackPaneHeight > maxHeight - MIN_HEIGHT_OF_TX_OR_RX_PANE_PX)
                        newRxDataStackPaneHeight = maxHeight - MIN_HEIGHT_OF_TX_OR_RX_PANE_PX;

                    logger.debug("newRxDataStackPaneHeight = " + newRxDataStackPaneHeight);

                    // Convert to a percentage of total height
                    currTxRxViewRatio = newRxDataStackPaneHeight / dataContainerGridPane.getHeight();

                    logger.debug("currTxRxViewRatio = " + currTxRxViewRatio);

                    //rxDataStackPane.setMinHeight(newRxDataStackPaneHeight);
                    //rxDataStackPane.setMaxHeight(newRxDataStackPaneHeight);
                    resizeTxRxPanes();

                }
            };

    /**
     * Resizes the TX and RX panes based on the value of <code>currTxRxViewRatio</code>.
     */
    private void resizeTxRxPanes() {

        // Just change the RX pane, the TX pane should adjust automatically
        double totalHeightOfBothTxAndRxPanes = dataContainerGridPane.getHeight() - draggableHBox.getHeight();

        if (totalHeightOfBothTxAndRxPanes <= 0.0) {
            //throw new RuntimeException("Total height of TX and RX panes was not greater than 0.");
            logger.debug("Can't resize TX/RX panes, total height of TX and RX panes not greater than 0. This can occur when this method is called for the first time before the panes are displayed in the UI.");
            return;
        }

        double rxPaneHeight = totalHeightOfBothTxAndRxPanes * currTxRxViewRatio;

        logger.debug("rxPaneHeight = " + rxPaneHeight);

        //txDataStackPane.setMinHeight(rxPaneHeight);
        //txDataStackPane.setMaxHeight(rxPaneHeight);
        dataContainerGridPane.getRowConstraints().get(0).setMinHeight(rxPaneHeight);
        dataContainerGridPane.getRowConstraints().get(0).setMaxHeight(rxPaneHeight);

        //rxDataScrollPane.setMinHeight(rxPaneHeight);
        //rxDataScrollPane.setMaxHeight(rxPaneHeight);


    }
}
