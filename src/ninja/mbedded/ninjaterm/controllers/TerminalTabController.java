package ninja.mbedded.ninjaterm.controllers;

import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.Button;
import javafx.scene.control.ComboBox;
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
 * @last-modified   2016-07-16
 */
public class TerminalTabController implements Initializable {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    public TextFlow rxTextTextFlow;

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    @Override
    public void initialize(URL location, ResourceBundle resources) {

        // Remove all dummy children (which are added just for design purposes
        // in scene builder)
        rxTextTextFlow.getChildren().clear();

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
