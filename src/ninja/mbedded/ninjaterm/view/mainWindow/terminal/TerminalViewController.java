package ninja.mbedded.ninjaterm.view.mainWindow.terminal;

import javafx.application.Platform;
import javafx.event.ActionEvent;
import javafx.event.EventHandler;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.input.KeyEvent;
import ninja.mbedded.ninjaterm.interfaces.OnRxDataListener;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.util.Decoding.Decoder;
import ninja.mbedded.ninjaterm.view.mainWindow.terminal.comSettings.ComSettingsViewController;
import ninja.mbedded.ninjaterm.view.mainWindow.terminal.logging.LoggingViewController;
import ninja.mbedded.ninjaterm.view.mainWindow.terminal.stats.StatsViewController;
import ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx.TxRxViewController;
import ninja.mbedded.ninjaterm.view.mainWindow.StatusBar.StatusBarViewController;
import ninja.mbedded.ninjaterm.util.comport.ComPort;
import ninja.mbedded.ninjaterm.util.comport.ComPortException;
import org.controlsfx.glyphfont.FontAwesome;
import org.controlsfx.glyphfont.GlyphFont;

import java.util.Optional;

/**
 * Controller for the "terminal" which is part of the main window.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-08-23
 * @last-modified   2016-09-22
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

    private Decoder decoder = new Decoder();

    private GlyphFont glyphFont;

    private Terminal terminal;
    private Model model;

    private OnRxDataListener onRxDataListener;

    public TerminalViewController() {
    }

    public void init(Model model, Terminal terminal, GlyphFont glyphFont) {

        this.model = model;
        this.terminal = terminal;


        this.glyphFont = glyphFont;
        //this.statusBarViewController = statusBarViewController;

        // Set children
        comSettingsViewController.setStatusBarController(model);


        comSettingsViewController.openCloseComPortButton.setOnAction((ActionEvent) -> {
            openCloseComPortButtonPressed();
        });

        // Select first tab by default
        terminalTabPane.getSelectionModel().select(0);

        txRxViewController.Init(model, terminal, decoder, glyphFont);

        // Set default style for OpenClose button
        setOpenCloseButtonStyle(OpenCloseButtonStyles.OPEN);

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

        comSettingsViewController.init();

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
        menuItem.setOnAction(new EventHandler<ActionEvent>(){
            @Override public void handle(ActionEvent e){
                //System.out.println("Testing!");
                showRenameTabDialogueBox();
            }
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
            handleKeyTyped(ke);
        });

        //==============================================//
        //============== INIT LOGGING TAB ==============//
        //==============================================//

        loggingViewController.init(model, terminal, glyphFont);

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
        if (result.isPresent()){
            // Write the new terminal name to the model. This should then
            // automatically update the terminal tab text.
            //terminal.terminalName.set(result.get());
            terminal.manuallyRenameTerminalTab(result.get());
        }
    }

    /**
     * Handler for the open/close COM port button. Opens and closes the COM port.
     */
    private void openCloseComPortButtonPressed() {

        //System.out.println("Button pressed handler called.");

        if (comSettingsViewController.openCloseComPortButton.getText().equals("Open")) {

            terminal.comPort.setName(comSettingsViewController.foundComPortsComboBox.getSelectionModel().getSelectedItem());

            try {
                terminal.comPort.open();
            } catch (ComPortException e) {
                if(e.type == ComPortException.ExceptionType.COM_PORT_BUSY) {
                    model.status.addErr(terminal.comPort.getName() + " was busy and could not be opened.");
                    //comPort = null;
                    return;
                } else if(e.type == ComPortException.ExceptionType.COM_PORT_DOES_NOT_EXIST) {
                    model.status.addErr(terminal.comPort.getName() + " no longer exists. Please rescan.");
                    //comPort = null;
                    return;
                } else {
                    throw new RuntimeException(e);
                }
            }

            // Set COM port parameters as specified by user on GUI
            terminal.comPort.setParams(
                    comSettingsViewController.baudRateComboBox.getSelectionModel().getSelectedItem(),
                    comSettingsViewController.numDataBitsComboBox.getSelectionModel().getSelectedItem(),
                    comSettingsViewController.parityComboBox.getSelectionModel().getSelectedItem(),
                    comSettingsViewController.numStopBitsComboBox.getSelectionModel().getSelectedItem()
            );

            // Add a listener to run when RX data is received from the COM port
            onRxDataListener = (rxData -> {

                //System.out.println("rawRxData = " + Arrays.toString(rawRxData));
                String rxText;
                rxText = decoder.parse(rxData);

                //System.out.println("rxText = " + rxText);

                Platform.runLater(() -> {

                    // Add the received data to the model
                    //txRxViewController.addTxRxText(rxText);
                    terminal.txRx.addRxData(rxText);

                    // Update stats in app model
                    terminal.stats.numCharactersRx.set(terminal.stats.numCharactersRx.get() + rxText.length());
                    model.globalStats.numCharactersRx.set(model.globalStats.numCharactersRx.get() + rxText.length());

                });

            });
            terminal.comPort.onRxDataListeners.add(onRxDataListener);

            // Change "Open" button to "Close" button
            setOpenCloseButtonStyle(OpenCloseButtonStyles.CLOSE);

            model.status.addMsg(terminal.comPort.getName() + " opened." +
                    " Buad rate = " + terminal.comPort.getBaudRate() + "," +
                    " parity = " + terminal.comPort.getParity() + "," +
                    " num. stop bits = " + terminal.comPort.getNumStopBits() + ".");

            // All non-UI code relating to opening COM port should eventually be moved into
            // this function!!!
            terminal.openComPort();

        } else {
            // Must be closing COM port
            terminal.comPort.onRxDataListeners.remove(onRxDataListener);

            try {
                terminal.comPort.close();
            } catch (ComPortException e) {
                if(e.type == ComPortException.ExceptionType.COM_PORT_DOES_NOT_EXIST) {
                    model.status.addErr("Attempted to close non-existant COM port. Was USB cable unplugged?");

                    // Since COM port does not exist anymore, set button back to "Open"
                    comSettingsViewController.openCloseComPortButton.setText("Open");
                    return;
                } else {
                    throw new RuntimeException(e);
                }
            }
            setOpenCloseButtonStyle(OpenCloseButtonStyles.OPEN);

            model.status.addMsg(terminal.comPort.getName() + " closed.");
        }

    }

    /**
     * Enumerates the available styles for the open-close COM port button.
     * Used by setOpenCloseButtonStyle().
     */
    private enum OpenCloseButtonStyles {
        OPEN,
        CLOSE
    }

    private void setOpenCloseButtonStyle(OpenCloseButtonStyles openCloseButtonStyle) {
        if(openCloseButtonStyle == OpenCloseButtonStyles.OPEN) {
            comSettingsViewController.openCloseComPortButton.setGraphic(glyphFont.create(FontAwesome.Glyph.PLAY));
            comSettingsViewController.openCloseComPortButton.setText("Open");
            comSettingsViewController.openCloseComPortButton.getStyleClass().remove("failure");
            comSettingsViewController.openCloseComPortButton.getStyleClass().add("success");

        } else if(openCloseButtonStyle == OpenCloseButtonStyles.CLOSE) {
            comSettingsViewController.openCloseComPortButton.setGraphic(glyphFont.create(FontAwesome.Glyph.STOP));
            comSettingsViewController.openCloseComPortButton.setText("Close");
            comSettingsViewController.openCloseComPortButton.getStyleClass().remove("success");
            comSettingsViewController.openCloseComPortButton.getStyleClass().add("failure");
        } else {
            throw new RuntimeException("openCloseButtonStyle not recognised.");
        }
    }

    /**
     * Called by event handler registered in this classes constructor when a key is typed while
     * this terminal tab is selected.
     *
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
