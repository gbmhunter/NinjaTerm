package ninja.mbedded.ninjaterm.view.mainwindow.terminal;

import javafx.application.Platform;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Tab;
import javafx.scene.control.TabPane;
import javafx.scene.input.KeyEvent;
import javafx.scene.layout.VBox;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.util.Decoding.Decoder;
import ninja.mbedded.ninjaterm.view.mainwindow.terminal.comSettings.ComSettings;
import ninja.mbedded.ninjaterm.view.mainwindow.terminal.rxtx.RxTxController;
import ninja.mbedded.ninjaterm.view.mainwindow.StatusBar.StatusBarController;
import ninja.mbedded.ninjaterm.util.comport.ComPort;
import ninja.mbedded.ninjaterm.util.comport.ComPortException;
import ninja.mbedded.ninjaterm.view.mainwindow.terminal.stats.StatsView;
import org.controlsfx.glyphfont.FontAwesome;
import org.controlsfx.glyphfont.GlyphFont;

import java.io.IOException;

/**
 * Controller for the "terminal" which is part of the main window.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-08-23
 * @last-modified   2016-08-23
 */
public class TerminalController extends Tab {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    public TabPane terminalTabPane;

    @FXML
    public ComSettings comSettings;

    @FXML
    public RxTxController rxTxController;

    @FXML
    public Tab rxTxTab;

    @FXML
    public StatsView statsView;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    /**
     * The COM port instance attached to this terminal.
     */
    public ComPort comPort = new ComPort();

    private StatusBarController statusBarController;
    private Decoder decoder = new Decoder();

    private GlyphFont glyphFont;

    private Terminal terminal;
    private Model model;

    public TerminalController() {

        FXMLLoader fxmlLoader = new FXMLLoader(getClass().getResource(
                "TerminalView.fxml"));

        fxmlLoader.setRoot(this);
        fxmlLoader.setController(this);

        try {
            fxmlLoader.load();
        } catch (IOException exception) {
            throw new RuntimeException(exception);
        }

    }

    public void init(Model model, Terminal terminal, GlyphFont glyphFont, StatusBarController statusBarController) {

        this.model = model;
        this.terminal = terminal;


        this.glyphFont = glyphFont;
        this.statusBarController = statusBarController;

        // Set children
        comSettings.setStatusBarController(model);


        comSettings.openCloseComPortButton.setOnAction((ActionEvent) -> {
            openCloseComPortButtonPressed();
        });

        // Select first tab by default
        terminalTabPane.getSelectionModel().select(0);

        // Create RX/TX view
        //rxTxController = new RxTxController();
        rxTxController.Init(model, terminal, comPort, decoder, statusBarController, glyphFont);
        rxTxTab.setContent(rxTxController);

        // Set default style for OpenClose button
        setOpenCloseButtonStyle(OpenCloseButtonStyles.OPEN);

        comSettings.openCloseComPortButton.setGraphic(glyphFont.create(FontAwesome.Glyph.PLAY));


        //==============================================//
        //============= INIT STATS SUB-TAB =============//
        //==============================================//

        statsView.init(terminal.stats);

        statusBarController.init(model);

    }

    /**
     * Handler for the open/close COM port button. Opens and closes the COM port.
     */
    private void openCloseComPortButtonPressed() {

        //System.out.println("Button pressed handler called.");

        if (comSettings.openCloseComPortButton.getText().equals("Open")) {

            comPort.setName(comSettings.foundComPortsComboBox.getSelectionModel().getSelectedItem());

            try {
                comPort.open();
            } catch (ComPortException e) {
                if(e.type == ComPortException.ExceptionType.COM_PORT_BUSY) {
                    model.status.addErr(comPort.getName() + " was busy and could not be opened.");
                    //comPort = null;
                    return;
                } else if(e.type == ComPortException.ExceptionType.COM_PORT_DOES_NOT_EXIST) {
                    model.status.addErr(comPort.getName() + " no longer exists. Please rescan.");
                    //comPort = null;
                    return;
                } else {
                    throw new RuntimeException(e);
                }
            }

            // Set COM port parameters as specified by user on GUI
            comPort.setParams(
                    comSettings.baudRateComboBox.getSelectionModel().getSelectedItem(),
                    comSettings.numDataBitsComboBox.getSelectionModel().getSelectedItem(),
                    comSettings.parityComboBox.getSelectionModel().getSelectedItem(),
                    comSettings.numStopBitsComboBox.getSelectionModel().getSelectedItem()
            );

            // Add a listener to run when RX data is received from the COM port
            comPort.addOnRxDataListener(rxData -> {

                //System.out.println("rxData = " + Arrays.toString(rxData));
                String rxText;
                rxText = decoder.parse(rxData);

                //System.out.println("rxText = " + rxText);

                Platform.runLater(() -> {

                    // Add the received data to the model
                    //rxTxController.addTxRxText(rxText);
                    terminal.txRx.addRxData(rxText);

                    // Update stats in app model
                    terminal.stats.numCharactersRx.set(terminal.stats.numCharactersRx.get() + rxText.length());
                    model.globalStats.numCharactersRx.set(model.globalStats.numCharactersRx.get() + rxText.length());

                });

            });

            // Change "Open" button to "Close" button
            setOpenCloseButtonStyle(OpenCloseButtonStyles.CLOSE);

            model.status.addMsg(comPort.getName() + " opened." +
                    " Buad rate = " + comPort.getBaudRate() + "," +
                    " parity = " + comPort.getParity() + "," +
                    " num. stop bits = " + comPort.getNumStopBits() + ".");

        } else {
            // Must be closing COM port

            try {
                comPort.close();
            } catch (ComPortException e) {
                if(e.type == ComPortException.ExceptionType.COM_PORT_DOES_NOT_EXIST) {
                    model.status.addErr("Attempted to close non-existant COM port. Was USB cable unplugged?");

                    // Since COM port does not exist anymore, set button back to "Open"
                    comSettings.openCloseComPortButton.setText("Open");
                    return;
                } else {
                    throw new RuntimeException(e);
                }
            }
            setOpenCloseButtonStyle(OpenCloseButtonStyles.OPEN);

            model.status.addMsg(comPort.getName() + " closed.");
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
            comSettings.openCloseComPortButton.setGraphic(glyphFont.create(FontAwesome.Glyph.PLAY));
            comSettings.openCloseComPortButton.setText("Open");
            comSettings.openCloseComPortButton.getStyleClass().remove("failure");
            comSettings.openCloseComPortButton.getStyleClass().add("success");

        } else if(openCloseButtonStyle == OpenCloseButtonStyles.CLOSE) {
            comSettings.openCloseComPortButton.setGraphic(glyphFont.create(FontAwesome.Glyph.STOP));
            comSettings.openCloseComPortButton.setText("Close");
            comSettings.openCloseComPortButton.getStyleClass().remove("success");
            comSettings.openCloseComPortButton.getStyleClass().add("failure");
        } else {
            throw new RuntimeException("openCloseButtonStyle not recognised.");
        }
    }

    /**
     * Called by event handler registered in MainWindowController when a key is typed while
     * this terminal tab is selected.
     * @param ke
     */
    public void handleKeyTyped(KeyEvent ke) {
        System.out.println("Key '" + ke.getCharacter() + "' pressed in terminal tab.");

        // We only want to send the characters to the serial port if the user pressed them
        // while the TX/RX tab was selected
        if (terminalTabPane.getSelectionModel().getSelectedItem() != rxTxTab) {
            return;
        }
        System.out.println("TX/RX sub-tab selected.");

        // Now that we have made sure the RX/TX sub-tab was open when the key was pressed,
        // call the appropriate function in the RX/TX controller.
        rxTxController.handleKeyTyped(ke);

    }

}
