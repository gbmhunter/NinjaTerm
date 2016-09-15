package ninja.mbedded.ninjaterm.view.mainwindow;

import javafx.application.Platform;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.MenuItem;
import javafx.scene.control.Tab;
import javafx.scene.control.TabPane;
import javafx.scene.input.KeyCode;
import javafx.scene.input.KeyEvent;
import ninja.mbedded.ninjaterm.managers.ComPortManager;
import ninja.mbedded.ninjaterm.view.mainwindow.StatusBar.StatusBarController;
import ninja.mbedded.ninjaterm.view.mainwindow.terminal.Terminal;

import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.ResourceBundle;

/**
 * Controller for the main window of NinjaTerm.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @last-modified 2016-09-14
 * @since 2016-07-08
 */
public class MainWindowController implements Initializable {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    public MenuItem newTerminalMenuItem;

    @FXML
    public MenuItem exitMenuItem;

    @FXML
    public TabPane terminalTabPane;

    @FXML
    public StatusBarController statusBarController;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    private ComPortManager comPortManager;

    public List<Terminal> terminals = new ArrayList<>();


    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    @Override
    public void initialize(URL location, ResourceBundle resources) {

        newTerminalMenuItem.setOnAction(event -> {
            System.out.println("newTerminalMenuItem clicked.");
            addNewTerminal();
        });

        exitMenuItem.setOnAction(event -> {
            // Quit the application
            Platform.exit();
        });

    }


    public void setComPortManager(ComPortManager comPortManager) {
        this.comPortManager = comPortManager;
    }

    /**
     * Adds a new terminal tab to the main window. Called when the "New terminal" menu button is clicked, as
     * well as once on startup.
     */
    public void addNewTerminal() {

        System.out.println(getClass().getName() + ".addNewTerminal() called.");


        Terminal terminal = new Terminal(statusBarController);
        terminals.add(terminal);

        terminal.comSettings.setComPortManager(comPortManager);
        // Peform a scan of the COM ports on start-up
        terminal.comSettings.scanComPorts();

        Tab terminalTab = new Tab();
        terminalTab.setText("Terminal " + Integer.toString(terminalTabPane.getTabs().size() + 1));
        terminalTab.setContent(terminal);

        terminalTabPane.getTabs().add(terminalTab);

        // NOTE: KEY_TYPED is ideal because it handles the pressing of shift to make capital
        // letters automatically (so we don't have to worry about them here)
        terminalTab.getContent().addEventFilter(KeyEvent.KEY_TYPED, ke -> {
            System.out.println("Key '" + ke.getCharacter() + "' pressed in terminal tab.");

            // We only want to send the characters to the serial port if the user pressed them
            // while the TX/RX tab was selected
            if (terminal.terminalTabPane.getSelectionModel().getSelectedItem() != terminal.rxTxTab) {
                return;
            }
            System.out.println("TX/RX sub-tab selected.");

            /*if (!(ke.getCharacter() || ke.getCode().isDigitKey() || ke.getCode().equals(KeyCode.ENTER))) {
                return;
            }
            System.out.println("Key pressed is alphanumeric or enter.");*/

            // Convert pressed key into a ASCII byte.
            // Hopefully this is only one character!!!
            byte[] data = new byte[1];
            data[0] = (byte)ke.getCharacter().charAt(0);

            if(terminal.comPort == null || terminal.comPort.isPortOpen() == false) {
                statusBarController.addErr("Cannot send COM port data, port is not open.");
                return;
            }

            // Send character to COM port
            terminal.comPort.sendData(data);

        });


    }


}
