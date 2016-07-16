package ninja.mbedded.ninjaterm.controllers;

import javafx.event.EventHandler;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.Button;
import javafx.scene.control.ComboBox;
import javafx.scene.control.ScrollPane;
import javafx.scene.image.ImageView;
import javafx.scene.input.MouseEvent;
import javafx.scene.paint.Color;
import javafx.scene.text.Text;
import javafx.scene.text.TextFlow;
import jssc.SerialPortList;

import java.net.URL;
import java.util.ResourceBundle;

/**
 * Controller for the "Terminal" tab which is part of the main window.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-07-16
 * @last-modified   2016-07-17
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
    public ImageView scrollToBottomImageView;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    /**
     * Determines whether the RX data terminal will auto-scroll to bottom
     * as more data arrives.
     */
    private Boolean stickToBottomEnabled = true;

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    /**
     * Called automatically by system when .fxml file is loaded.
     * @param location
     * @param resources
     */
    @Override
    public void initialize(URL location, ResourceBundle resources) {

        // Remove all dummy children (which are added just for design purposes
        // in scene builder)
        rxTextTextFlow.getChildren().clear();

        rxTextTextFlow.heightProperty().addListener((observable, oldValue, newValue) -> {
            System.out.println("heightProperty changed to " + newValue);

            if(stickToBottomEnabled) {
                rxDataScrollPane.setVvalue(rxTextTextFlow.getHeight());
            }

        });

        //==============================================//
        //=== SCROLL-TO-BOTTOM BUTTON EVENT HANDLERS ===//
        //==============================================//

        scrollToBottomImageView.addEventFilter(MouseEvent.MOUSE_ENTERED, (MouseEvent mouseEvent) -> {
                System.out.println("Mouse entered." + mouseEvent.getSource());
            }
        );

        scrollToBottomImageView.addEventFilter(MouseEvent.MOUSE_EXITED, (MouseEvent mouseEvent) -> {
                    System.out.println("Mouse exited." + mouseEvent.getSource());
                }
        );

        scrollToBottomImageView.addEventFilter(MouseEvent.MOUSE_CLICKED, (MouseEvent mouseEvent) -> {
                    System.out.println("Mouse click detected! " + mouseEvent.getSource());
                }
        );

    }

    /**
     * Adds the given text to the RX terminal display.
     * @param rxText    The text you want to add.
     */
    public void addRxText(String rxText) {

        Text text = new Text(rxText);
        text.setFill(Color.GREEN);
        rxTextTextFlow.getChildren().add(text);
    }

}
