package ninja.mbedded.ninjaterm.view.mainWindow;

import javafx.application.Platform;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.*;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import ninja.mbedded.ninjaterm.managers.ComPortManager;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.util.appInfo.AppInfo;
import ninja.mbedded.ninjaterm.view.mainWindow.StatusBar.StatusBarViewController;
import ninja.mbedded.ninjaterm.view.mainWindow.terminal.TerminalViewController;
import org.controlsfx.glyphfont.FontAwesome;
import org.controlsfx.glyphfont.Glyph;
import org.controlsfx.glyphfont.GlyphFont;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Controller for the main window of NinjaTerm.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-07-08
 * @last-modified 2016-09-22
 */
public class MainWindowViewController {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    public VBox mainVBox;

    @FXML
    public MenuItem newTerminalMenuItem;

    @FXML
    public MenuItem exitMenuItem;

    @FXML
    public MenuItem helpAboutMenuItem;

    @FXML
    public TabPane terminalTabPane;

    @FXML
    private Tab newTerminalTab;

    @FXML
    private StatusBarViewController statusBarViewController;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    private ComPortManager comPortManager;

    public List<TerminalViewController> terminalViewControllers = new ArrayList<>();

    private GlyphFont glyphFont;

    private Model model;

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public MainWindowViewController() {

    }

    /**
     * Initialises everything that cannot be done in the constructor (due to JavaFX creating the
     * object automatically).
     * @param model
     * @param glyphFont
     * @param comPortManager
     */
    public void init(Model model, GlyphFont glyphFont, ComPortManager comPortManager) {

        this.model = model;
        this.glyphFont = glyphFont;
        this.comPortManager = comPortManager;

        //==============================================//
        //=================== MENU SETUP ===============//
        //==============================================//

        Glyph glyph = glyphFont.create(FontAwesome.Glyph.TERMINAL);
        glyph.setColor(Color.BLACK);
        newTerminalMenuItem.setGraphic(glyph);
        newTerminalMenuItem.setOnAction(event -> {
            System.out.println("newTerminalMenuItem clicked.");
            addNewTerminal();
        });

        glyph = glyphFont.create(FontAwesome.Glyph.SIGN_OUT);
        glyph.setColor(Color.BLACK);
        exitMenuItem.setGraphic(glyph);
        exitMenuItem.setOnAction(event -> {
            // Quit the application
            Platform.exit();
        });

        helpAboutMenuItem.setOnAction(event -> {

            String versionNumber = AppInfo.getVersionNumber();

            // Sometimes the version number will be null, but this should only occur when running from IntelliJ
            // in a development environment (install4j will add the appropriate .dll when a .exe is built)
            if(versionNumber == null) {
                versionNumber = "?.?.?";
            }

            Alert alert = new Alert(Alert.AlertType.INFORMATION);
            alert.setTitle("About");
            alert.setHeaderText(null);
            alert.setContentText("NinjaTerm v" + versionNumber + "\r\rA free tool from www.mbedded.ninja.\r\rWritten by:\rGeoffrey Hunter");
            alert.showAndWait();
        });

        //==============================================//
        //================ TERMINAL SETUP ==============//
        //==============================================//

        // Install handler for when the model emits a terminal
        // closed event
        model.closedTerminalListeners.add(terminal -> {
            handleCloseTerminal(terminal);
        });

        // This makes the "+" sign more visible
        newTerminalTab.setStyle("-fx-font-weight: bold;");

        // Install click handler for the "new terminal" tab
        terminalTabPane.getSelectionModel().selectedItemProperty().addListener((observable, oldValue, newValue) -> {
            if(newValue == newTerminalTab) {
//                System.out.println("\"New terminal\" tab clicked.");
                addNewTerminal();
            }
        });

        //==============================================//
        //================== STATUS BAR ================//
        //==============================================//

        statusBarViewController.init(model);

    }

    /**
     * Adds a new terminal tab to the main window. Called when the "New terminal" menu button is clicked, as
     * well as once on startup.
     */
    public void addNewTerminal() {

        System.out.println(getClass().getName() + ".addNewTerminal() called.");

        // Create a new Terminal object in the model
        Terminal terminal = new Terminal(model);

        // Make sure the model has a record to this newly created terminal
        model.terminals.add(terminal);

        FXMLLoader loader = new FXMLLoader(getClass().getResource("terminal/TerminalView.fxml"));

        Tab terminalTab;
        try {
            terminalTab = (Tab)loader.load();
        } catch(IOException e) {
            return;
        }

        // Extract controller from this view and perform setup on it
        TerminalViewController terminalViewController = loader.getController();
        terminalViewController.init(model, terminal, glyphFont);

        // Save a reference to this TerminalView controller
        terminalViewControllers.add(terminalViewController);

        terminalViewController.comSettingsViewController.setComPortManager(comPortManager);
        // Peform a scan of the COM ports on start-up
        terminalViewController.comSettingsViewController.scanComPorts();

        // Add the Tab view to the TabPane
        // NOTE: The last tab is the static "new tab" button, so always insert a new tab
        // before this one
        terminalTabPane.getTabs().add(terminalTabPane.getTabs().size() - 1, terminalTab);

        // Select this newly created terminal tab
        terminalTabPane.getSelectionModel().select(terminalTab);
    }

    /**
     * Handler for a CloseTerminal event sent from the model.
     * @param terminal
     */
    public void handleCloseTerminal(Terminal terminal) {

        // Find the terminal controller associated with this terminal
        for(TerminalViewController terminalViewController : terminalViewControllers) {
            if(terminalViewController.getTerminal() == terminal) {
                // We have found the correct terminal to close
                // Remove both the Tab from the TabPane and the TerminalController
                // from the list
                terminalTabPane.getTabs().remove(terminalViewController.getTerminalTab());
                terminalViewControllers.remove(terminalViewController);
                return;
            }
        }

        // If we get here, we didn't find the terminal!
        throw new RuntimeException("Terminal close request received, but could not find the requested terminal to close.");

    }
}
