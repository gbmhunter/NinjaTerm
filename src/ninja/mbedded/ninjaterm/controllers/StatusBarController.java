package ninja.mbedded.ninjaterm.controllers;

import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.Button;
import javafx.scene.control.ComboBox;
import javafx.scene.text.Text;
import javafx.scene.text.TextFlow;
import jssc.SerialPortList;

import java.net.URL;
import java.util.ResourceBundle;

/**
 * Controller for the "Status Bar" which is part of the main window.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-07-10
 * @last-modified   2016-07-16
 */
public class StatusBarController implements Initializable {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    public TextFlow statusTextFlow;

    private MainWindowController mainWindowController;

    @Override
    public void initialize(URL location, ResourceBundle resources) {

    }

    public void setMainWindowController(MainWindowController mainWindowController) {
        this.mainWindowController = mainWindowController;
    }

    public void addMsg(String msg) {
        statusTextFlow.getChildren().add(new Text(msg + "\r\n"));
    }

}
