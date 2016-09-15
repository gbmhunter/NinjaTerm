package ninja.mbedded.ninjaterm.view.mainwindow.terminal;

import javafx.application.Platform;
import javafx.event.EventHandler;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Button;
import javafx.scene.control.Tab;
import javafx.scene.control.TabPane;
import javafx.scene.input.KeyEvent;
import javafx.scene.layout.VBox;
import ninja.mbedded.ninjaterm.util.Decoding.Decoder;
import ninja.mbedded.ninjaterm.view.mainwindow.terminal.comSettings.ComSettings;
import ninja.mbedded.ninjaterm.view.mainwindow.terminal.rxtx.RxTxView;
import ninja.mbedded.ninjaterm.view.mainwindow.StatusBar.StatusBarController;
import ninja.mbedded.ninjaterm.util.comport.ComPort;
import ninja.mbedded.ninjaterm.util.comport.ComPortException;
import org.controlsfx.glyphfont.FontAwesome;
import org.controlsfx.glyphfont.GlyphFont;
import org.controlsfx.glyphfont.GlyphFontRegistry;

import java.io.IOException;

/**
 * Controller for the "terminal" which is part of the main window.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-08-23
 * @last-modified   2016-08-23
 */
public class Terminal extends VBox {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    public TabPane terminalTabPane;

    @FXML
    public ComSettings comSettings;

    @FXML
    public RxTxView rxTxView;

    @FXML
    public Tab rxTxTab;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    private ComPort comPort;
    private StatusBarController statusBarController;
    private Decoder decoder = new Decoder();

    private GlyphFont fontAwesome;


    public Terminal(StatusBarController statusBarController) {

        FXMLLoader fxmlLoader = new FXMLLoader(getClass().getResource(
                "Terminal.fxml"));

        fxmlLoader.setRoot(this);
        fxmlLoader.setController(this);

        try {
            fxmlLoader.load();
        } catch (IOException exception) {
            throw new RuntimeException(exception);
        }


        this.statusBarController = statusBarController;
        // Set children
        comSettings.setStatusBarController(statusBarController);


        comSettings.openCloseComPortButton.setOnAction((ActionEvent) -> {
            openCloseComPortButtonPressed();
        });

        // Select first tab by default
        terminalTabPane.getSelectionModel().select(0);

        // Create RX/TX view
        rxTxView = new RxTxView(decoder);
        rxTxTab.setContent(rxTxView);

        // Initialise fontAwesome glyths (these are downloaded from CDN)
        //! @todo Remove dependency on internet connection
        fontAwesome = GlyphFontRegistry.font("FontAwesome");

        // Set default style for OpenClose button
        setOpenCloseButtonStyle(OpenCloseButtonStyles.OPEN);



    }

    /**
     * Handler for the open/close COM port button. Opens and closes the COM port.
     */
    private void openCloseComPortButtonPressed() {

        //System.out.println("Button pressed handler called.");

        if (comSettings.openCloseComPortButton.getText().equals("Open")) {

            comPort = new ComPort(comSettings.foundComPortsComboBox.getSelectionModel().getSelectedItem());

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

                    rxTxView.addRxText(rxText);
                });

            });

            // Change "Open" button to "Close" button
            setOpenCloseButtonStyle(OpenCloseButtonStyles.CLOSE);

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
                    comSettings.openCloseComPortButton.setText("Open");
                    return;
                } else {
                    throw new RuntimeException(e);
                }
            }
            setOpenCloseButtonStyle(OpenCloseButtonStyles.OPEN);

            statusBarController.addMsg(comPort.getName() + " closed.");
        }

    }

    private enum OpenCloseButtonStyles {
        OPEN,
        CLOSE
    }

    private void setOpenCloseButtonStyle(OpenCloseButtonStyles openCloseButtonStyle) {
        if(openCloseButtonStyle == OpenCloseButtonStyles.OPEN) {
            comSettings.openCloseComPortButton.setGraphic(fontAwesome.create(FontAwesome.Glyph.PLAY));
            comSettings.openCloseComPortButton.setText("Open");
            comSettings.openCloseComPortButton.getStyleClass().remove("failure");
            comSettings.openCloseComPortButton.getStyleClass().add("success");

        } else if(openCloseButtonStyle == OpenCloseButtonStyles.CLOSE) {
            comSettings.openCloseComPortButton.setGraphic(fontAwesome.create(FontAwesome.Glyph.STOP));
            comSettings.openCloseComPortButton.setText("Close");
            comSettings.openCloseComPortButton.getStyleClass().remove("success");
            comSettings.openCloseComPortButton.getStyleClass().add("failure");
        } else {
            throw new RuntimeException("openCloseButtonStyle not recognised.");
        }
    }

}
