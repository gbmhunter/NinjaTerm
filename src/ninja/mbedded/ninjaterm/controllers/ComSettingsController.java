package ninja.mbedded.ninjaterm.controllers;

import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.Button;
import javafx.scene.control.ComboBox;
import jssc.SerialPortList;
import ninja.mbedded.ninjaterm.managers.ComPortManager;

import java.net.URL;
import java.util.ResourceBundle;

/**
 * Controller for the "COM Settings tab" which is part of the main window.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-07-10
 * @last-modified   2016-07-16
 */
public class ComSettingsController implements Initializable {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    public Button scanButton;

    @FXML
    public ComboBox<String> foundComPortsComboBox;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    private StatusBarController statusBarController;

    private ComPortManager comPortManager;

    @Override
    public void initialize(URL location, ResourceBundle resources) {

        // Attach handler for "Scan" button press
        scanButton.setOnAction((actionEvent) -> {
            scanButtonPressed();
        });

        // Attach handler for selected item change for COM port combo box
//        foundComPortsComboBox.getSelectionModel().selectedItemProperty().addListener((changeListener) -> {
//            selectedComPortChanged();
//        });

    }

    public void setStatusBarController(StatusBarController statusBarController) {
        this.statusBarController = statusBarController;
    }

    private void scanButtonPressed() {
        System.out.println("Scan button pressed.");

        // Clear any existing COM ports that are in the combobox from a previous scan
        foundComPortsComboBox.getItems().clear();

        String[] portNames = comPortManager.scan();

        if(portNames.length == 0) {
            statusBarController.addMsg("No COM ports found on this computer.");
            return;
        }

        statusBarController.addMsg(portNames.length + " COM port(s) found.");
        foundComPortsComboBox.getItems().addAll(portNames);

        // Select first one in list for convenience
        foundComPortsComboBox.getSelectionModel().select(0);

    }

    public void setComPortManager(ComPortManager comPortManager) {
        this.comPortManager = comPortManager;
    }


}
