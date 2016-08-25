package ninja.mbedded.ninjaterm.view.MainWindow.Terminal;

import javafx.application.Platform;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.TabPane;
import ninja.mbedded.ninjaterm.util.Decoding.Decoder;
import ninja.mbedded.ninjaterm.view.MainWindow.Terminal.ComSettings.ComSettingsController;
import ninja.mbedded.ninjaterm.view.MainWindow.Terminal.RxTx.RxTxController;
import ninja.mbedded.ninjaterm.view.MainWindow.StatusBar.StatusBarController;
import ninja.mbedded.ninjaterm.util.comport.ComPort;
import ninja.mbedded.ninjaterm.util.comport.ComPortException;

import java.io.UnsupportedEncodingException;
import java.net.URL;
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
    public TabPane terminalTabPane;

    @FXML
    public ComSettingsController comSettingsController;

    @FXML
    public RxTxController rxTxController;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    private ComPort comPort;
    private StatusBarController statusBarController;
    private Decoder decoder = new Decoder();


    @Override
    public void initialize(URL location, ResourceBundle resources) {
        comSettingsController.openCloseComPortButton.setOnAction((ActionEvent) -> {
            openCloseComPortButtonPressed();
        });

        // Select first tab by default
        terminalTabPane.getSelectionModel().select(0);

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

            try {
                comPort.open();
            } catch (ComPortException e) {
                if(e.type == ComPortException.ExceptionType.COM_PORT_BUSY) {
                    statusBarController.addErr(comPort.getName() + " was busy and could not be opened.");
                    comPort = null;
                    return;
                } else if(e.type == ComPortException.ExceptionType.COM_PORT_DOES_NOT_EXIST) {
                    statusBarController.addErr(comPort.getName() + " no longer exists. Please rescan.");
                    comPort = null;
                    return;
                } else {
                    throw new RuntimeException(e);
                }
            }

            // Set COM port parameters as specified by user on GUI
            comPort.setParams(
                    comSettingsController.baudRateComboBox.getSelectionModel().getSelectedItem(),
                    comSettingsController.numDataBitsComboBox.getSelectionModel().getSelectedItem(),
                    comSettingsController.parityComboBox.getSelectionModel().getSelectedItem(),
                    comSettingsController.numStopBitsComboBox.getSelectionModel().getSelectedItem()
            );

            // Add a listener to run when RX data is received from the COM port
            comPort.addOnRxDataListener(rxData -> {

                //System.out.println("rxData = " + Arrays.toString(rxData));
                String rxText;
                rxText = decoder.parse(rxData);

                //System.out.println("rxText = " + rxText);

                Platform.runLater(() -> {

                    rxTxController.addRxText(rxText);
                });

            });

            comSettingsController.openCloseComPortButton.setText("Close");
            statusBarController.addMsg(comPort.getName() + " opened." +
                    " Buad rate = " + comPort.getBaudRate() + "," +
                    " parity = " + comPort.getParity() + "," +
                    " num. stop bits = " + comPort.getNumStopBits() + ".");

        } else {
            // Must be closing COM port

            try {
                comPort.close();
            } catch (ComPortException e) {
                if(e.type == ComPortException.ExceptionType.COM_PORT_DOES_NOT_EXIST) {
                    statusBarController.addErr("Attempted to close non-existant COM port. Was USB cable unplugged?");

                    // Since COM port does not exist anymore, set button back to "Open"
                    comSettingsController.openCloseComPortButton.setText("Open");
                    return;
                } else {
                    throw new RuntimeException(e);
                }
            }
            comSettingsController.openCloseComPortButton.setText("Open");
            statusBarController.addMsg(comPort.getName() + " closed.");
        }

    }

}
