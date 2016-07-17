package ninja.mbedded.ninjaterm.controllers;

import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.ScrollPane;
import javafx.scene.image.ImageView;
import javafx.scene.input.MouseEvent;
import javafx.scene.input.ScrollEvent;
import javafx.scene.layout.Pane;
import javafx.scene.paint.Color;
import javafx.scene.text.Text;
import javafx.scene.text.TextFlow;

import java.net.URL;
import java.util.ResourceBundle;

/**
 * Controller for the "Terminal" tab which is part of the main window.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @last-modified 2016-07-17
 * @since 2016-07-16
 */
public class TerminalTabController implements Initializable {

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

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    /**
     * Called automatically by system when .fxml file is loaded.
     *
     * @param location
     * @param resources
     */
    @Override
    public void initialize(URL location, ResourceBundle resources) {

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


        scrollToBottomImageView.setOpacity(AUTO_SCROLL_BUTTON_OPACITY_NON_HOVER);

        // This adds a listener which will implement the "auto-scroll" functionality
        // when it is enabled with @link{autoScrollEnabled}.
        rxTextTextFlow.heightProperty().addListener((observable, oldValue, newValue) -> {
            System.out.println("heightProperty changed to " + newValue);

            if (autoScrollEnabled) {
                rxDataScrollPane.setVvalue(rxTextTextFlow.getHeight());
            }

        });

        rxDataScrollPane.addEventFilter(ScrollEvent.ANY, event -> {

            // Since the user has now scrolled manually, disable the
            // auto-scroll
            autoScrollEnabled = false;

            autoScrollButtonPane.setVisible(true);
        });

        //==============================================//
        //===== AUTO-SCROLL BUTTON EVENT HANDLERS ======//
        //==============================================//

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
