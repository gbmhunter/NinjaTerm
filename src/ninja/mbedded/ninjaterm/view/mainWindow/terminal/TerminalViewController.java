package ninja.mbedded.ninjaterm.view.mainWindow.terminal;

import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.input.KeyCode;
import javafx.scene.input.KeyCodeCombination;
import javafx.scene.input.KeyCombination;
import javafx.scene.input.KeyEvent;
import ninja.mbedded.ninjaterm.util.comport.OnRxDataListener;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import ninja.mbedded.ninjaterm.view.mainWindow.terminal.comSettings.ComSettingsViewController;
import ninja.mbedded.ninjaterm.view.mainWindow.terminal.logging.LoggingViewController;
import ninja.mbedded.ninjaterm.view.mainWindow.terminal.stats.StatsViewController;
import ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx.TxRxViewController;
import org.controlsfx.glyphfont.FontAwesome;
import org.controlsfx.glyphfont.GlyphFont;
import org.slf4j.Logger;

import java.util.Optional;

/**
 * Controller for the "terminal" which is part of the main window.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-08-23
 * @last-modified 2016-11-05
 */
public class TerminalViewController {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    private Tab terminalTab;

    @FXML
    public TabPane terminalTabPane;

    @FXML
    public ComSettingsViewController comSettingsViewController;

    @FXML
    public TxRxViewController txRxViewController;

    @FXML
    public Tab txRxView;

    @FXML
    private LoggingViewController loggingViewController;

    @FXML
    private StatsViewController statsViewController;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    //private Decoder decoder = new Decoder();

    private GlyphFont glyphFont;

    private Terminal terminal;
    private Model model;

    private OnRxDataListener onRxDataListener;

    private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

    public TerminalViewController() {
    }

    public void init(Model model, Terminal terminal, GlyphFont glyphFont) {

        this.model = model;
        this.terminal = terminal;


        this.glyphFont = glyphFont;
        //this.statusBarViewController = statusBarViewController;

        // Set children


        // Select first tab by default
        terminalTabPane.getSelectionModel().select(0);

        txRxViewController.Init(model, terminal, glyphFont);

        comSettingsViewController.openCloseComPortButton.setGraphic(glyphFont.create(FontAwesome.Glyph.PLAY));

        //==============================================//
        //======== ATTACH LISTENER FOR TAB NAME ========//
        //==============================================//

        terminal.terminalName.addListener((observable, oldValue, newValue) -> {
            terminalTab.setText(newValue);
        });

        // Set default
        terminalTab.setText(terminal.terminalName.get());

        //==============================================//
        //========= INIT COM SETTINGS SUB-TAB ==========//
        //==============================================//

        comSettingsViewController.init(model, terminal, glyphFont);

        comSettingsViewController.openCloseComPortButton.setOnAction((ActionEvent) -> {
            openCloseComPortButtonPressed();
        });

        //==============================================//
        //============= INIT STATS SUB-TAB =============//
        //==============================================//

        statsViewController.init(terminal);

        //==============================================//
        //============= SETUP CONTEXT MENU =============//
        //==============================================//

        // Create right-click context menu for tab
        ContextMenu contextMenu = new ContextMenu();

        MenuItem menuItem = new MenuItem("Rename");
        menuItem.setOnAction((ActionEvent e) -> {
            showRenameTabDialogueBox();
        });
        contextMenu.getItems().add(menuItem);

        menuItem = new MenuItem("Close");
        menuItem.setOnAction((ActionEvent e) -> {
            model.closeTerminal(terminal);
        });
        contextMenu.getItems().add(menuItem);


        terminalTab.setContextMenu(contextMenu);

        //==============================================//
        //========= INSTALL KEY-PRESS HANDLER ==========//
        //==============================================//

        // We have to attach the key-typed event handler here, as attaching it the just the TX/RX sub-tab of the terminal tab
        // doesn't seem to work.
        // NOTE: KEY_TYPED is ideal because it handles the pressing of shift to make capital
        // letters automatically (so we don't have to worry about them here)
        terminalTab.getContent().addEventFilter(KeyEvent.KEY_TYPED, ke -> {

            // Catch all key-presses that occur inside a TextInputControl object, and prevent them
            // from being sent to the COM port
            if(ke.getTarget() instanceof TextInputControl){
                logger.debug("Key was pressed inside a TextInputControl object, so not sending to COM port.");
                return;
            }

            handleKeyTyped(ke);
        });

        terminalTab.getContent().addEventHandler(KeyEvent.KEY_PRESSED, event -> {
            logger.debug("Key pressed. event.getCode = " + event.getCode());

            KeyCodeCombination copyKeyCodeCompination = new KeyCodeCombination(KeyCode.C, KeyCombination.CONTROL_ANY);

            if (copyKeyCodeCompination.match(event)) {
                logger.debug("CTRL+C pressed");

            }

            if(event.isControlDown() && event.getCode() == KeyCode.V) {
                logger.debug("CTRL+V pressed");
                // e.consume();
            }
        });

        //==============================================//
        //============== INIT LOGGING TAB ==============//
        //==============================================//

        loggingViewController.init(model, terminal, glyphFont);

    }

    public Terminal getTerminal() {
        return terminal;
    }

    public Tab getTerminalTab() {
        return terminalTab;
    }

    /**
     * Allows the user to rename the terminal tab. Function does not return until
     * name has been set.
     */
    private void showRenameTabDialogueBox() {

        TextInputDialog dialog = new TextInputDialog(terminal.terminalName.get());
        dialog.setTitle("Rename Tab");
        dialog.setHeaderText("Rename Tab");
        dialog.setContentText("Please enter new name:");

        // Get the response value.
        Optional<String> result = dialog.showAndWait();
        if (result.isPresent()) {
            // Write the new terminal name to the model. This should then
            // automatically update the terminal tab text.
            //terminal.terminalName.set(result.get());
            terminal.manuallyRenameTerminalTab(result.get());
        }
    }

    /**
     * Handler for the open/close COM port button.
     * Calls the methods in the model to open and close the COM port.
     */
    private void openCloseComPortButtonPressed() {

        if (!terminal.isComPortOpen.get()) {
            terminal.openComPort();
        } else {
            terminal.closeComPort();
        }
    }




    /**
     * Called by event handler registered in this classes constructor when a key is typed while
     * this terminal tab is selected.
     * <p>
     * Only key-presses in the TX/RX tab are acted upon, all others are ignored.
     *
     * @param ke
     */
    public void handleKeyTyped(KeyEvent ke) {
        //System.out.println("Key '" + ke.getCharacter() + "' pressed in terminal tab.");

        // We only want to send the characters to the serial port if the user pressed them
        // while the TX/RX tab was selected
        if (terminalTabPane.getSelectionModel().getSelectedItem() != txRxView) {
            return;
        }
        System.out.println("TX/RX sub-tab selected.");

        // Now that we have made sure the RX/TX sub-tab was open when the key was pressed,
        // call the appropriate function in the RX/TX controller.
        txRxViewController.handleKeyTyped(ke);

    }

}
