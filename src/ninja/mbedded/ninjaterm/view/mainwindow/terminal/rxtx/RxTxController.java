package ninja.mbedded.ninjaterm.view.mainwindow.terminal.rxtx;

import javafx.animation.FadeTransition;
import javafx.animation.Timeline;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Button;
import javafx.scene.control.ScrollPane;
import javafx.scene.image.ImageView;
import javafx.scene.input.*;
import javafx.scene.layout.Pane;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.scene.text.Text;
import javafx.scene.text.TextFlow;
import javafx.util.Duration;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.util.Decoding.Decoder;
import ninja.mbedded.ninjaterm.util.comport.ComPort;
import ninja.mbedded.ninjaterm.view.mainwindow.StatusBar.StatusBarController;
import ninja.mbedded.ninjaterm.view.mainwindow.terminal.rxtx.display.DisplayController;
import org.controlsfx.control.PopOver;
import org.controlsfx.glyphfont.FontAwesome;
import org.controlsfx.glyphfont.GlyphFont;

import java.io.IOException;

/**
 * Controller for the "terminal" tab which is part of the main window.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-07-16
 * @last-modified 2016-09-15
 */
public class RxTxController extends VBox {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    public VBox dataContainerVBox;

    @FXML
    public ScrollPane rxDataScrollPane;

    @FXML
    public TextFlow txRxTextFlow;

    @FXML
    public TextFlow txTextFlow;

    @FXML
    public Text txDataText;

    @FXML
    public Pane autoScrollButtonPane;

    @FXML
    public ImageView scrollToBottomImageView;

    @FXML
    public Button clearTextButton;

    @FXML
    public Button displayButton;

    @FXML
    public Button filtersButton;

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

    /**
     * Determines whether the RX data terminal will auto-scroll to bottom
     * as more data arrives.
     */
    private Boolean autoScrollEnabled = true;

    private Text txRxDataText = new Text();

    private Decoder decoder;

    private StatusBarController statusBarController;

    private GlyphFont glyphFont;

    private Model model;

    /**
     * Stores the model which drives this view.
     */
    private Terminal terminal;

    /**
     * A Text object which holds a flashing caret. This is moved between the shared TX/RX pane and
     * the TX pane.
     */
    private Text caretText;

    private ComPort comPort;

    private DisplayController displayController = new DisplayController();

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//


    public RxTxController() {

        FXMLLoader fxmlLoader = new FXMLLoader(getClass().getResource(
                "RxTxView.fxml"));

        fxmlLoader.setRoot(this);
        fxmlLoader.setController(this);

        try {
            fxmlLoader.load();
        } catch (IOException exception) {
            throw new RuntimeException(exception);
        }
    }

    /**
     * Initialisation method because we are not allowed to have input parameters in the constructor.
     * @param glyphFont
     */
    public void Init(Model model, Terminal terminal, ComPort comPort, Decoder decoder, StatusBarController statusBarController, GlyphFont glyphFont) {

        // Save model
        this.model = model;
        this.terminal = terminal;

        this.comPort = comPort;
        this.glyphFont = glyphFont;

        clearTextButton.setGraphic(glyphFont.create(FontAwesome.Glyph.ERASER));
        displayButton.setGraphic(glyphFont.create(FontAwesome.Glyph.ARROWS));
        filtersButton.setGraphic(glyphFont.create(FontAwesome.Glyph.FILTER));

        this.decoder = decoder;
        this.statusBarController = statusBarController;

        // Remove all dummy children (which are added just for design purposes
        // in scene builder)
        txRxTextFlow.getChildren().clear();

        // Hide the auto-scroll image-button, this will be made visible
        // when the user manually scrolls
        autoScrollButtonPane.setVisible(false);

        // Add default Text node to text flow. Received text
        // will be added to this node.
        txRxTextFlow.getChildren().add(txRxDataText);
        txRxDataText.setFill(Color.LIME);

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
        txRxTextFlow.getChildren().add(caretText);

        // Set default opacity for scroll-to-bottom image
        scrollToBottomImageView.setOpacity(AUTO_SCROLL_BUTTON_OPACITY_NON_HOVER);

        //==============================================//
        //==== AUTO-SCROLL RELATED EVENT HANDLERS ======//
        //==============================================//

        // This adds a listener which will implement the "auto-scroll" functionality
        // when it is enabled with @link{autoScrollEnabled}.
        txRxTextFlow.heightProperty().addListener((observable, oldValue, newValue) -> {
            //System.out.println("heightProperty changed to " + newValue);

            if (autoScrollEnabled) {
                rxDataScrollPane.setVvalue(txRxTextFlow.getHeight());
            }

        });

        rxDataScrollPane.addEventFilter(ScrollEvent.ANY, event -> {

            // If the user scrolled downwards, we don't want to disable auto-scroll,
            // so check and return if so.
            if (event.getDeltaY() <= 0)
                return;

            // Since the user has now scrolled upwards (manually), disable the
            // auto-scroll
            autoScrollEnabled = false;

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

        autoScrollButtonPane.addEventFilter(MouseEvent.MOUSE_CLICKED, (MouseEvent mouseEvent) -> {
                    //System.out.println("Mouse click detected! " + mouseEvent.getSource());

                    // Enable auto-scroll
                    autoScrollEnabled = true;

                    // Hide the auto-scroll button. This is made visible again when the user
                    // manually scrolls.
                    autoScrollButtonPane.setVisible(false);

                    // Manually perform one auto-scroll, since the next automatic one won't happen until
                    // the height of txRxTextFlow changes.
                    rxDataScrollPane.setVvalue(txRxTextFlow.getHeight());
                }
        );

        //==============================================//
        //====== CLEAR TEXT BUTTON EVENT HANDLERS ======//
        //==============================================//

        clearTextButton.setOnAction(event -> {
            // Clear all the text
            //txRxDataText.setText("");
            terminal.txRx.txRxData.set("");
            terminal.txRx.sentTxData.set("");
            model.status.addMsg("Terminal TX/RX text cleared.");

        });

        //==============================================//
        //============= LAYOUT BUTTON SETUP ============//
        //==============================================//

        displayController.init(model, terminal, decoder);

        // This creates the popover, but is not shown until
        // show() is called.
        PopOver displayPopover = new PopOver();
        displayPopover.setContentNode(displayController);
        displayPopover.setArrowLocation(PopOver.ArrowLocation.RIGHT_CENTER);
        displayPopover.setCornerRadius(4);
        displayPopover.setTitle("Display");

        displayButton.setOnAction(event -> {

            if (displayPopover.isShowing()) {
                displayPopover.hide();
            } else if (!displayPopover.isShowing()) {
                showPopover(displayButton, displayPopover);
            } else {
                new RuntimeException("displayPopover state not recognised.");
            }
        });

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

        terminal.txRx.display.selectedLayoutOption.addListener((observable, oldValue, newValue) -> {
            System.out.println("Selected layout option has been changed.");
            updateLayout();
        });

        //==============================================//
        //======= BIND TERMINAL TEXT TO TXRX DATA ======//
        //==============================================//

        txRxDataText.textProperty().bind(terminal.txRx.txRxData);
        txDataText.textProperty().bind(terminal.txRx.sentTxData);

        // Call this to update the display of the TX/RX pane into its default
        // state
        updateLayout();
    }

    /**
     * Updates the text wrapping to the current user-selected settings.
     * Called from both the checkbox and wrapping width textfield listeners.
     */
    private void updateTextWrapping() {

        if (terminal.txRx.display.wrappingEnabled.get()) {
            System.out.println("\"Wrapping\" checkbox checked.");

            // Set the width of the TextFlow UI object. This will set the wrapping width
            // (there is no wrapping object)
            txRxTextFlow.setMaxWidth(terminal.txRx.display.wrappingWidth.get());

        } else {
            System.out.println("\"Wrapping\" checkbox unchecked.");
            txRxTextFlow.setMaxWidth(Double.MAX_VALUE);
        }
    }


    public void showPopover(Button button, PopOver popOver) {

        System.out.println(getClass().getName() + ".showPopover() called.");

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

    /**
     * Adds the given text to the RX terminal display.
     *
     * @param text The text you want to add.
     */
    public void addTxRxText(String text) {

        // WARNING: This method didn't work well, as it added empty lines depending on whether the
        // provided rxText had printable chars, or was just a carriage return or new line (or both)
        //Text text = new Text(rxText);
        //text.setFill(Color.LIME);
        //txRxTextFlow.getChildren().add(text);

        // This was works better!
        txRxDataText.setText(txRxDataText.getText() + text);

    }

    /**
     * Updates the layout of the TX/RX tab based on the layout option selected
     * in the model.
     */
    public void updateLayout() {
        switch(terminal.txRx.display.selectedLayoutOption.get()) {
            case COMBINED_TX_RX:

                // Hide TX pane

                //txTextFlow.setMinHeight(0.0);
                //txTextFlow.setMaxHeight(0.0);
                if(dataContainerVBox.getChildren().contains(txTextFlow)){
                    dataContainerVBox.getChildren().remove(txTextFlow);
                }

                // Add the caret in the shared pane
                if(txRxTextFlow.getChildren().indexOf(caretText) == -1) {
                    txRxTextFlow.getChildren().add(caretText);
                }

                break;
            case SEPARATE_TX_RX:

                // Show TX pane
                //txTextFlow.setMinHeight(100.0);
                //txTextFlow.setMaxHeight(100.0);
                if(!dataContainerVBox.getChildren().contains(txTextFlow)) {
                    dataContainerVBox.getChildren().add(txTextFlow);
                }

                // Remove the caret in the shared pane
                if(txRxTextFlow.getChildren().indexOf(caretText) >= 0) {
                    txRxTextFlow.getChildren().remove(caretText);
                }

                // Add the caret to the TX pane
                if(txTextFlow.getChildren().indexOf(caretText) == -1) {
                    txTextFlow.getChildren().add(caretText);
                }

                break;
            default:
                throw new RuntimeException("selectedLayoutOption unrecognised!");
        }
    }

    public void handleKeyTyped(KeyEvent keyEvent) {

        if(comPort.isPortOpen() == false) {
            model.status.addErr("Cannot send data to COM port, port is not open.");
            return;
        }

        // Convert pressed key into a ASCII byte.
        // Hopefully this is only one character!!!
        byte data = (byte)keyEvent.getCharacter().charAt(0);

        // Append the character to the end of the "to send" TX buffer
        terminal.txRx.toSendTxData.add(data);

        // Check so see what TX mode we are in
        switch(terminal.txRx.display.selTxCharSendingOption.get()) {
            case SEND_TX_CHARS_IMMEDIATELY:
                break;
            case SEND_TX_CHARS_ON_ENTER:
                // Check for enter key before sending data
                if(!keyEvent.getCharacter().equals("\r"))
                    return;
                break;
            default:
                throw new RuntimeException("selTxCharSendingOption not recognised!");
        }

        // Send data to COM port, and update stats (both local and global)
        byte[] dataAsByteArray = fromObservableListToByteArray(terminal.txRx.toSendTxData);
        comPort.sendData(dataAsByteArray);
        // Delete the "to send" TX buffer, since bytes have now been passed to COM object for
        // sending
        terminal.txRx.toSendTxData.clear();

        terminal.stats.numCharactersTx.setValue(terminal.stats.numCharactersTx.getValue() + dataAsByteArray.length);
        model.globalStats.numCharactersTx.setValue(model.globalStats.numCharactersTx.getValue() + dataAsByteArray.length);

        terminal.txRx.sentTxData.set(terminal.txRx.sentTxData.get() + data);

        terminal.txRx.addSentTxData(dataAsByteArray);

        // Check if user wants TX chars to be echoed locally onto TX/RX display
        /*if(terminal.txRx.display.localTxEcho.get()) {
            // Echo the sent character to the TX/RX display
            terminal.txRx.addRxData(ke.getCharacter());
        }*/
    }



    public byte[] fromObservableListToByteArray(ObservableList<Byte> observableList) {

        byte[] data = new byte[observableList.size()];
        int i = 0;
        for(Byte singleByte : observableList) {
            data[i++] = singleByte;
        }

        return data;

    }

}
