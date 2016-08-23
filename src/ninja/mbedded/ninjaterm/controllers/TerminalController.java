package ninja.mbedded.ninjaterm.controllers;

import javafx.application.Platform;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.text.Text;
import javafx.scene.text.TextFlow;
import ninja.mbedded.ninjaterm.util.comport.ComPort;

import java.io.UnsupportedEncodingException;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.ResourceBundle;

/**
 * Controller for the "Terminal" which is part of the main window.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-08-23
 * @last-modified   2016-08-23
 */
public class TerminalController implements Initializable {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    public ComSettingsController comSettingsController;

    @FXML
    public RxTxDataController rxTxDataController;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    private ComPort comPort;
    private StatusBarController statusBarController;


    @Override
    public void initialize(URL location, ResourceBundle resources) {
        comSettingsController.openCloseComPortButton.setOnAction((ActionEvent) -> {
            openCloseComPortButtonPressed();
        });

    }

    public void setStatusBarController(StatusBarController statusBarController) {
        this.statusBarController = statusBarController;

        // Set children
        comSettingsController.setStatusBarController(statusBarController);
    }

    /**
     * Handler for the open/close COM port button. Opens and closes the COM port.
     */
    private void openCloseComPortButtonPressed() {

        //System.out.println("Button pressed handler called.");

        if (comSettingsController.openCloseComPortButton.getText().equals("Open")) {

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

                    rxTxDataController.addRxText(rxText);
                });

            });

            comSettingsController.openCloseComPortButton.setText("Close");
            statusBarController.addMsg(comPort.getName() + " opened.");

        } else {

            comPort.close();
            comSettingsController.openCloseComPortButton.setText("Open");
            statusBarController.addMsg(comPort.getName() + " closed.");
        }

    }

}
