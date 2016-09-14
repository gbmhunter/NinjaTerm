package ninja.mbedded.ninjaterm.view.mainwindow.terminal.rxtx;

import javafx.animation.FadeTransition;
import javafx.animation.Timeline;
import javafx.beans.value.ObservableValue;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Button;
import javafx.scene.control.ScrollPane;
import javafx.scene.image.ImageView;
import javafx.scene.input.MouseEvent;
import javafx.scene.input.ScrollEvent;
import javafx.scene.layout.Pane;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.scene.text.Text;
import javafx.scene.text.TextFlow;
import javafx.util.Duration;
import ninja.mbedded.ninjaterm.util.Decoding.Decoder;
import ninja.mbedded.ninjaterm.view.mainwindow.terminal.rxtx.formatting.Formatting;
import org.controlsfx.control.PopOver;

import java.io.IOException;

/**
 * Controller for the "terminal" tab which is part of the main window.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @last-modified 2016-07-17
 * @since 2016-07-16
 */
public class RxTxView extends VBox {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    public ScrollPane rxDataScrollPane;

    @FXML
    public TextFlow rxTextTextFlow;

    @FXML
    public Pane autoScrollButtonPane;

    @FXML
    public ImageView scrollToBottomImageView;

    @FXML
    public Button clearTextButton;

    @FXML
    public Button decodingButton;

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

    private Text terminalText = new Text();

    private PopOver decodingPopOver;

    private Decoder decoder;

    /**
     * This is a UI element whose constructor is called manually. This UI element is inserted
     * as a child of a pop-over.
     */
    Formatting formatting;

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//


    public RxTxView(Decoder decoder) {

        FXMLLoader fxmlLoader = new FXMLLoader(getClass().getResource(
                "RxTxView.fxml"));

        fxmlLoader.setRoot(this);
        fxmlLoader.setController(this);

        try {
            fxmlLoader.load();
        } catch (IOException exception) {
            throw new RuntimeException(exception);
        }

        this.decoder = decoder;

        // Remove all dummy children (which are added just for design purposes
        // in scene builder)
        rxTextTextFlow.getChildren().clear();

        // Hide the auto-scroll image-button, this will be made visible
        // when the user manually scrolls
        autoScrollButtonPane.setVisible(false);

        // Add default Text node to text flow. Received text
        // will be added to this node.
        rxTextTextFlow.getChildren().add(terminalText);
        terminalText.setFill(Color.LIME);

        //==============================================//
        //============== CREATE CARET ==================//
        //==============================================//

        // Create caret symbol using ANSI character
        Text caretText = new Text("█");
        caretText.setFill(Color.LIME);

        // Add an animation so the caret blinks
        FadeTransition ft = new FadeTransition(Duration.millis(200), caretText);
        ft.setFromValue(1.0);
        ft.setToValue(0.1);
        ft.setCycleCount(Timeline.INDEFINITE);
        ft.setAutoReverse(true);
        ft.play();

        // Finally, add the blinking caret as the last child in the TextFlow
        rxTextTextFlow.getChildren().add(caretText);

        // Set default opacity for scroll-to-bottom image
        scrollToBottomImageView.setOpacity(AUTO_SCROLL_BUTTON_OPACITY_NON_HOVER);

        //==============================================//
        //==== AUTO-SCROLL RELATED EVENT HANDLERS ======//
        //==============================================//

        // This adds a listener which will implement the "auto-scroll" functionality
        // when it is enabled with @link{autoScrollEnabled}.
        rxTextTextFlow.heightProperty().addListener((observable, oldValue, newValue) -> {
            //System.out.println("heightProperty changed to " + newValue);

            if (autoScrollEnabled) {
                rxDataScrollPane.setVvalue(rxTextTextFlow.getHeight());
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
                    // the height of rxTextTextFlow changes.
                    rxDataScrollPane.setVvalue(rxTextTextFlow.getHeight());
                }
        );

        //==============================================//
        //====== CLEAR TEXT BUTTON EVENT HANDLERS ======//
        //==============================================//

        clearTextButton.setOnAction(event -> {
            // Clear all the text
            terminalText.setText("");
        });

        decodingButton.setOnAction(event -> {

            if (decodingPopOver.isShowing()) {
                decodingPopOver.hide();
            } else if (!decodingPopOver.isShowing()) {
                showDecodingPopover();
            } else {
                new RuntimeException("decodingPopOver state not recognised.");
            }

        });

        filtersButton.setOnAction(event -> {
            // Show filters window

        });

        //==============================================//
        //=============== CREATE POP-OVER ==============//
        //==============================================//

        formatting = new Formatting(decoder);

        // Attach a listener to the "Wrapping" checkbox
        formatting.wrappingCheckBox.selectedProperty().addListener(
                (ObservableValue<? extends Boolean> observable, Boolean oldValue, Boolean newValue) -> {
                    updateTextWrapping();
                });

        // Attach listener to the "Wrapping Width" text field
        formatting.wrappingWidthTextField.textProperty().addListener((observable, oldValue, newValue) -> {
            updateTextWrapping();
        });

        // Set the default wrapping width and then enable wrapping. This should call the event handler
        // which will update the UI correctly.
        formatting.wrappingWidthTextField.setText("800");
        formatting.wrappingCheckBox.setSelected(true);

        // This creates the popover, but is not shown until
        // show() is called.
        decodingPopOver = new PopOver();
        decodingPopOver.setContentNode(formatting);
        decodingPopOver.setArrowLocation(PopOver.ArrowLocation.RIGHT_CENTER);
        decodingPopOver.setCornerRadius(4);
        decodingPopOver.setTitle("Formatting");

    }

    /**
     * Updates the text wrapping to the current user-selected settings.
     * Called from both the checkbox and wrapping width textfield listeners.
     */
    private void updateTextWrapping() {

        if (formatting.wrappingCheckBox.isSelected()) {
            System.out.println("\"Wrapping\" checkbox checked.");

            Double wrappingWidth;
            try {
                wrappingWidth = Double.parseDouble(formatting.wrappingWidthTextField.getText());
            } catch (NumberFormatException e) {
                System.out.println("ERROR: Wrapping width was not a valid number.");
                return;
            }

            if (wrappingWidth <= 0.0) {
                System.out.println("ERROR: Wrapping width must be greater than 0.");
                return;
            }

            // Set the width of the TextFlow UI object. This will set the wrapping width
            // (there is no wrapping object)
            rxTextTextFlow.setMaxWidth(wrappingWidth);

        } else {
            System.out.println("\"Wrapping\" checkbox unchecked.");
            rxTextTextFlow.setMaxWidth(Double.MAX_VALUE);
        }
    }


    public void showDecodingPopover() {

        System.out.println(getClass().getName() + ".showDecodingPopover() called.");

        //==============================================//
        //=============== DECODING POPOVER =============//
        //==============================================//

        double clickX = decodingButton.localToScreen(decodingButton.getBoundsInLocal()).getMinX();
        double clickY = (decodingButton.localToScreen(decodingButton.getBoundsInLocal()).getMinY() +
                decodingButton.localToScreen(decodingButton.getBoundsInLocal()).getMaxY()) / 2;

        decodingPopOver.show(decodingButton.getScene().getWindow());
        decodingPopOver.setX(clickX - decodingPopOver.getWidth());
        decodingPopOver.setY(clickY - decodingPopOver.getHeight() / 2);

    }

    /**
     * Adds the given text to the RX terminal display.
     *
     * @param rxText The text you want to add.
     */
    public void addRxText(String rxText) {

        // WARNING: This method didn't work well, as it added empty lines depending on whether the
        // provided rxText had printable chars, or was just a carriage return or new line (or both)
        //Text text = new Text(rxText);
        //text.setFill(Color.LIME);
        //rxTextTextFlow.getChildren().add(text);

        // This was works better!
        terminalText.setText(terminalText.getText() + rxText);

    }

}
