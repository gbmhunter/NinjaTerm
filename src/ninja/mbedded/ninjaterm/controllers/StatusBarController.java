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
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.ResourceBundle;

/**
 * Controller for the "Status Bar" which is part of the main window.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-07-10
 * @last-modified   2016-07-17
 */
public class StatusBarController implements Initializable {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    public TextFlow statusTextFlow;

    //private MainWindowController mainWindowController;

    @Override
    public void initialize(URL location, ResourceBundle resources) {

    }

//    public void setMainWindowController(MainWindowController mainWindowController) {
//        this.mainWindowController = mainWindowController;
//    }

    /**
     * Prints the given message to the status window. This prepends the current date/time to the massage
     * as well as adding a carriage return and new-line character to the end of the message.
     * @param msg   The message you want to print.
     */
    public void addMsg(String msg) {

        // Build up a string of the current date/time (incl. milli-seconds)
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS");
        Date date = new Date();
        String dateString = sdf.format(date);

        statusTextFlow.getChildren().add(new Text(dateString + ": " + msg + "\r\n"));
    }

    /**
     * Prints the given error message to the status window. This prepends the current date/time to the massage
     * as well as adding a carriage return and new-line character to the end of the message.
     * @param msg   The error message you want to print.
     */
    public void addErr(String msg) {

        // Build up a string of the current date/time (incl. milli-seconds)
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS");
        Date date = new Date();
        String dateString = sdf.format(date);

        Text text = new Text(dateString + ": ERROR. " + msg + "\r\n");
        text.setFill(Color.RED);
        statusTextFlow.getChildren().add(text);
    }

}
