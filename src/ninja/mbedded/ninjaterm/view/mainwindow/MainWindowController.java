package ninja.mbedded.ninjaterm.view.mainwindow;

import com.install4j.api.ApplicationRegistry;
import javafx.application.Platform;
import javafx.event.ActionEvent;
import javafx.event.EventHandler;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.fxml.Initializable;
import javafx.scene.control.*;
import javafx.scene.input.KeyEvent;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import ninja.mbedded.ninjaterm.managers.ComPortManager;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.util.appInfo.AppInfo;
import ninja.mbedded.ninjaterm.view.mainwindow.StatusBar.StatusBarController;
import ninja.mbedded.ninjaterm.view.mainwindow.terminal.TerminalController;
import org.controlsfx.glyphfont.FontAwesome;
import org.controlsfx.glyphfont.Glyph;
import org.controlsfx.glyphfont.GlyphFont;

import java.io.IOException;
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
public class MainWindowController extends VBox {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    public MenuItem newTerminalMenuItem;

    @FXML
    public MenuItem exitMenuItem;

    @FXML
    public MenuItem helpAboutMenuItem;

    @FXML
    public TabPane terminalTabPane;

    @FXML
    public StatusBarController statusBarController;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    private ComPortManager comPortManager;

    public List<TerminalController> terminalControllers = new ArrayList<>();

    private GlyphFont glyphFont;

    private Model model;

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public MainWindowController() {
        FXMLLoader fxmlLoader = new FXMLLoader(getClass().getResource(
                "MainWindow.fxml"));

        fxmlLoader.setRoot(this);
        fxmlLoader.setController(this);

        try {
            fxmlLoader.load();
        } catch (IOException exception) {
            throw new RuntimeException(exception);
        }
    }

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

            if(versionNumber == null) {
                versionNumber = "?.?.?";
            }

            Alert alert = new Alert(Alert.AlertType.INFORMATION);
            alert.setTitle("About");
            alert.setHeaderText(null);
            alert.setContentText("NinjaTerm v" + versionNumber + "\r\rA free tool from www.mbedded.ninja.\r\rWritten by:\rGeoffrey Hunter");
            alert.showAndWait();
        });

    }

    /**
     * Adds a new terminal tab to the main window. Called when the "New terminal" menu button is clicked, as
     * well as once on startup.
     */
    public void addNewTerminal() {

        System.out.println(getClass().getName() + ".addNewTerminal() called.");

        // Create a new Terminal object in the model
        Terminal terminal = new Terminal();
        model.terminals.add(terminal);


        TerminalController terminalController = new TerminalController();
        terminalController.init(model, terminal, glyphFont, statusBarController);
        terminalControllers.add(terminalController);

        terminalController.comSettings.setComPortManager(comPortManager);
        // Peform a scan of the COM ports on start-up
        terminalController.comSettings.scanComPorts();

        terminalController.setText("Terminal " + Integer.toString(terminalTabPane.getTabs().size() + 1));

        // Create right-click context menu for tab
        ContextMenu contextMenu = new ContextMenu();
        MenuItem menuItem = new MenuItem("Do Some Action");
        menuItem.setOnAction(new EventHandler<ActionEvent>(){
            @Override public void handle(ActionEvent e){
                System.out.println("Testing!");
            }
        });
        contextMenu.getItems().add(menuItem);
        terminalController.setContextMenu(contextMenu);

        terminalTabPane.getTabs().add(terminalController);

        // We have to attach the key-typed event handler here, as attaching it the just the TX/RX sub-tab of the terminal tab
        // doesn't seem to work.
        // NOTE: KEY_TYPED is ideal because it handles the pressing of shift to make capital
        // letters automatically (so we don't have to worry about them here)
        terminalController.getContent().addEventFilter(KeyEvent.KEY_TYPED, ke -> {
            terminalController.handleKeyTyped(ke);
        });
    }
}
