package ninja.mbedded.ninjaterm.controllers;

import javafx.application.Platform;
import javafx.event.EventHandler;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.Button;
import javafx.scene.input.MouseEvent;
import ninja.mbedded.ninjaterm.managers.ComPortManager;
import ninja.mbedded.ninjaterm.util.comport.ComPort;

import java.io.UnsupportedEncodingException;
import java.net.URL;
import java.util.Arrays;
import java.util.ResourceBundle;

/**
 * Controller for the main window of NinjaTerm.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-07-08
 * @last-modified   2016-07-16
 */
public class MainWindowController implements Initializable {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    public Button openCloseComPortButton;

    @FXML
    public ComSettingsController comSettingsController;

    @FXML
    public TerminalTabController terminalTabController;

    @FXML
    public StatusBarController statusBarController;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    private ComPortManager comPortManager;

    private ComPort comPort;

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    @Override
    public void initialize(URL location, ResourceBundle resources) {


        comSettingsController.setStatusBarController(statusBarController);

        openCloseComPortButton.setOnAction((ActionEvent) -> {
            openCloseComPortButtonPressed();
        });

        // Attach handler for when selected COM port changes. This is responsible for
        // enabling/disabling the "Open" button as appropriate
        comSettingsController.foundComPortsComboBox.getSelectionModel().selectedItemProperty().addListener((observable, oldValue, newValue) -> {
            System.out.println("ComboBox selected item changed.");

            // newValue will be null if a scan was done and no COM ports
            // were found
            if (newValue == null) {
                openCloseComPortButton.setDisable(true);
            } else {
                openCloseComPortButton.setDisable(false);
            }
        });

    }

    /**
     * Handler for the open/close COM port button. Opens and closes the COM port.
     */
    private void openCloseComPortButtonPressed() {

        //System.out.println("Button pressed handler called.");

        if (openCloseComPortButton.getText().equals("Open")) {

            comPort = new ComPort(comSettingsController.foundComPortsComboBox.getSelectionModel().getSelectedItem());

            comPort.open();

            // Set COM port parameters as specified by user on GUI
            comPort.setParams(
                    comSettingsController.baudRateComboBox.getSelectionModel().getSelectedItem(),
                    comSettingsController.numDataBitsComboBox.getSelectionModel().getSelectedItem(),
                    comSettingsController.parityComboBox.getSelectionModel().getSelectedItem(),
                    comSettingsController.numStopBitsComboBox.getSelectionModel().getSelectedItem()
                    );


            comPort.addOnRxDataListener(rxData -> {

                //System.out.println("rxData = " + Arrays.toString(rxData));
                String rxText;
                try {
                    rxText = new String(rxData, "UTF-8");
                } catch (UnsupportedEncodingException e) {
                    throw new RuntimeException(e);
                }

                //System.out.println("rxText = " + rxText);

                Platform.runLater(() -> {

                    terminalTabController.addRxText(rxText);
                });

            });

            openCloseComPortButton.setText("Close");
            statusBarController.addMsg(comPort.getName() + " opened.");

        } else {

            comPort.close();
            openCloseComPortButton.setText("Open");
            statusBarController.addMsg(comPort.getName() + " closed.");
        }

    }

    public void setComPortManager(ComPortManager comPortManager) {
        this.comPortManager = comPortManager;

        // Also pass to all child UI objects
        comSettingsController.setComPortManager(comPortManager);

    }


}
