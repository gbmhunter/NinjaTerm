package ninja.mbedded.ninjaterm.controllers;

import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.Button;
import javafx.scene.control.ComboBox;
import javafx.scene.text.Text;
import jssc.*;

import java.net.URL;
import java.util.ResourceBundle;

/**
 * Controller for the "COM Settings tab" which is part of the main window.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-07-10
 * @last-modified   2016-07-10
 */
public class ComSettingsController implements Initializable {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    public Button scanButton;

    @FXML
    public ComboBox foundComPortsComboBox;

    private StatusBarController statusBarController;

    @Override
    public void initialize(URL location, ResourceBundle resources) {

        scanButton.setOnAction((actionEvent) -> {
            scanButtonPressed();
        });
    }

    public void setStatusBarController(StatusBarController statusBarController) {
        this.statusBarController = statusBarController;
    }

    private void scanButtonPressed() {
        System.out.println("Scan button pressed.");

        String[] portNames = SerialPortList.getPortNames();

        if(portNames.length == 0) {
            statusBarController.statusTextFlow.getChildren().add(new Text("No COM ports found on this computer."));
        }

        foundComPortsComboBox.getItems().addAll(portNames);

    }

}
