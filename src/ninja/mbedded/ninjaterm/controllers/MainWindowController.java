package ninja.mbedded.ninjaterm.controllers;

import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.Button;
import ninja.mbedded.ninjaterm.managers.ComPortManager;

import java.net.URL;
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
    public Button newTerminalButton;

    @FXML
    public TerminalController terminalController;

    @FXML
    public StatusBarController statusBarController;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    private ComPortManager comPortManager;



    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    @Override
    public void initialize(URL location, ResourceBundle resources) {


        terminalController.setStatusBarController(statusBarController);



        // Attach handler for when selected COM port changes. This is responsible for
        // enabling/disabling the "Open" button as appropriate
//        comSettingsController.foundComPortsComboBox.getSelectionModel().selectedItemProperty().addListener((observable, oldValue, newValue) -> {
//            System.out.println("ComboBox selected item changed.");
//
//            // newValue will be null if a scan was done and no COM ports
//            // were found
//            if (newValue == null) {
//                newTerminalButton.setDisable(true);
//            } else {
//                newTerminalButton.setDisable(false);
//            }
//        });

    }



    public void setComPortManager(ComPortManager comPortManager) {
        this.comPortManager = comPortManager;

        // Also pass to all child UI objects
        terminalController.comSettingsController.setComPortManager(comPortManager);

    }


}
