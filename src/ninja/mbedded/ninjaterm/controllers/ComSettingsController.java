package ninja.mbedded.ninjaterm.controllers;

import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.Button;
import javafx.scene.control.ComboBox;
import jssc.SerialPortList;
import ninja.mbedded.ninjaterm.managers.ComPortManager;
import ninja.mbedded.ninjaterm.util.comport.BaudRates;
import ninja.mbedded.ninjaterm.util.comport.NumDataBits;
import ninja.mbedded.ninjaterm.util.comport.NumStopBits;
import ninja.mbedded.ninjaterm.util.comport.Parities;

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

    @FXML
    public ComboBox<BaudRates> baudRateComboBox;

    @FXML
    public ComboBox<NumDataBits> numDataBitsComboBox;

    @FXML
    public ComboBox<Parities> parityComboBox;

    @FXML
    public ComboBox<NumStopBits> numStopBitsComboBox;

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

        //==============================================//
        //=============== POPULATE COMBOBOXES ==========//
        //==============================================//

        baudRateComboBox.getItems().setAll(BaudRates.values());
        baudRateComboBox.getSelectionModel().select(BaudRates.BAUD_9600);

        numDataBitsComboBox.getItems().setAll(NumDataBits.values());
        numDataBitsComboBox.getSelectionModel().select(NumDataBits.EIGHT);

        parityComboBox.getItems().setAll(Parities.values());
        parityComboBox.getSelectionModel().select(Parities.NONE);

        numStopBitsComboBox.getItems().setAll(NumStopBits.values());
        numStopBitsComboBox.getSelectionModel().select(NumStopBits.ONE);

    }

    public void setStatusBarController(StatusBarController statusBarController) {
        this.statusBarController = statusBarController;
    }

    private void scanButtonPressed() {
        System.out.println("Scan button pressed.");

        scanComPorts();
    }

    public void scanComPorts() {

        System.out.println(this.getClass().getName() + ".scanComPorts() called.");

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
