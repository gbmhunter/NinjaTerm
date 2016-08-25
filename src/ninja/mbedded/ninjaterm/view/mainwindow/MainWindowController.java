package ninja.mbedded.ninjaterm.view.mainwindow;

import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.fxml.Initializable;
import javafx.scene.Node;
import javafx.scene.control.MenuItem;
import javafx.scene.control.Tab;
import javafx.scene.control.TabPane;
import ninja.mbedded.ninjaterm.view.mainwindow.StatusBar.StatusBarController;
import ninja.mbedded.ninjaterm.view.mainwindow.terminal.TerminalController;
import ninja.mbedded.ninjaterm.managers.ComPortManager;

import java.io.IOException;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
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
    public MenuItem newTerminalMenuItem;

    @FXML
    public TabPane terminalTabPane;

    @FXML
    public StatusBarController statusBarController;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    private ComPortManager comPortManager;

    public List<TerminalController> terminalControllers = new ArrayList<>();


    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    @Override
    public void initialize(URL location, ResourceBundle resources) {

        newTerminalMenuItem.setOnAction(event -> {
            System.out.println("newTerminalMenuItem clicked.");
            addNewTerminal();
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

        URL resource = getClass().getResource("terminal/terminal.fxml");
        if(resource == null) {
            throw new RuntimeException("Resource could not be found. Is URL correct?");
        }

        FXMLLoader loader = new FXMLLoader(resource);

        try {
            Node node = loader.load();

            TerminalController terminalController = loader.getController();
            terminalControllers.add(terminalController);

            terminalController.setStatusBarController(statusBarController);
            terminalController.comSettingsController.setComPortManager(comPortManager);
            // Peform a scan of the COM ports on start-up
            terminalController.comSettingsController.scanComPorts();

            Tab terminalTab = new Tab();
            terminalTab.setText("terminal " + Integer.toString(terminalTabPane.getTabs().size() + 1));
            terminalTab.setContent(node);

            terminalTabPane.getTabs().add(terminalTab);

        } catch (IOException e) {
            throw new RuntimeException(e);
        }

    }


}
