package ninja.mbedded.ninjaterm.view.mainWindow.terminal.comSettings;

import javafx.fxml.FXML;
import javafx.scene.control.Button;
import javafx.scene.control.ComboBox;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.managers.ComPortManager;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.util.comport.*;
import org.controlsfx.glyphfont.FontAwesome;
import org.controlsfx.glyphfont.GlyphFont;

/**
 * Controller for the "COM Settings tab" which is part of the main window.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-07-10
 * @last-modified   2016-10-05
 */
public class ComSettingsViewController {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    public Button reScanButton;

    @FXML
    public ComboBox<String> foundComPortsComboBox;

    @FXML
    public ComboBox<BaudRates> baudRateComboBox;

    @FXML
    public ComboBox<NumDataBits> numDataBitsComboBox;

    @FXML
    public ComboBox<Parities> parityComboBox;

    @FXML
    public ComboBox<NumStopBits> numStopBitsComboBox;

    @FXML
    public Button openCloseComPortButton;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    private Model model;

    private ComPortManager comPortManager;

    private GlyphFont glyphFont;

    public ComSettingsViewController() {
    }

    public void init(Model model, Terminal terminal, GlyphFont glyphFont) {

        this.model = model;
        this.glyphFont = glyphFont;

        // Attach handler for "Scan" button press
        reScanButton.setOnAction((actionEvent) -> {
            scanButtonPressed();
        });

        //==============================================//
        //=========== POPULATE/BIND COMBOBOXES =========//
        //==============================================//

        terminal.comPortSettings.selComPortName.bind(foundComPortsComboBox.getSelectionModel().selectedItemProperty());

        baudRateComboBox.getItems().setAll(BaudRates.values());
        baudRateComboBox.getSelectionModel().select(BaudRates.BAUD_9600);
        terminal.comPortSettings.selBaudRate.bind(baudRateComboBox.getSelectionModel().selectedItemProperty());

        numDataBitsComboBox.getItems().setAll(NumDataBits.values());
        numDataBitsComboBox.getSelectionModel().select(NumDataBits.EIGHT);
        terminal.comPortSettings.selNumDataBits.bind(numDataBitsComboBox.getSelectionModel().selectedItemProperty());

        parityComboBox.getItems().setAll(Parities.values());
        parityComboBox.getSelectionModel().select(Parities.NONE);
        terminal.comPortSettings.selParity.bind(parityComboBox.getSelectionModel().selectedItemProperty());

        numStopBitsComboBox.getItems().setAll(NumStopBits.values());
        numStopBitsComboBox.getSelectionModel().select(NumStopBits.ONE);
        terminal.comPortSettings.selNumStopBits.bind(numStopBitsComboBox.getSelectionModel().selectedItemProperty());

        // Attach handler for when selected COM port changes. This is responsible for
        // enabling/disabling the "Open" button as appropriate
        foundComPortsComboBox.getSelectionModel().selectedItemProperty().addListener((observable, oldValue, newValue) -> {
            System.out.println("ComboBox selected item changed.");

            // newValue will be null if a scan was done and no COM ports
            // were found
            if (newValue == null) {
                openCloseComPortButton.setDisable(true);
            } else {
                openCloseComPortButton.setDisable(false);
            }
        });

        //==============================================//
        //=== ATTACH LISTENERS TO COM PORT OPEN/CLOSE ==//
        //==============================================//

        terminal.isComPortOpen.addListener((observable, oldValue, newValue) -> {
            if(!newValue)
                setOpenCloseComPortButtonStyle(OpenCloseButtonStyles.OPEN);
            else
                setOpenCloseComPortButtonStyle(OpenCloseButtonStyles.CLOSE);
        });

        // Set default style for OpenClose button
        setOpenCloseComPortButtonStyle(OpenCloseButtonStyles.OPEN);
    }

    /**
     * Enumerates the available styles for the open-close COM port button.
     * Used by setOpenCloseButtonStyle().
     */
    private enum OpenCloseButtonStyles {
        OPEN,
        CLOSE
    }

    private void setOpenCloseComPortButtonStyle(
            OpenCloseButtonStyles openCloseComPortButtonStyle) {
        if (openCloseComPortButtonStyle == OpenCloseButtonStyles.OPEN) {
            openCloseComPortButton.setGraphic(glyphFont.create(FontAwesome.Glyph.PLAY));
            openCloseComPortButton.setText("Open");
            openCloseComPortButton.getStyleClass().remove("failure");
            openCloseComPortButton.getStyleClass().add("success");

        } else if (openCloseComPortButtonStyle == OpenCloseButtonStyles.CLOSE) {
            openCloseComPortButton.setGraphic(glyphFont.create(FontAwesome.Glyph.STOP));
            openCloseComPortButton.setText("Close");
            openCloseComPortButton.getStyleClass().remove("success");
            openCloseComPortButton.getStyleClass().add("failure");
        } else {
            throw new RuntimeException("openCloseButtonStyle not recognised.");
        }
    }

//    public void setStatusBarController(Model model) {
//        this.model = model;
//    }

    private void scanButtonPressed() {
        System.out.println("Scan button pressed.");

        scanComPorts();
    }

    public void scanComPorts() {

        System.out.println(this.getClass().getName() + ".scanComPorts() called.");

        // Clear any existing COM ports that are in the combobox from a previous scan
        foundComPortsComboBox.getItems().clear();

        String[] portNames = comPortManager.scan();

        if(portNames.length == 0) {
            model.status.addMsg("No COM ports found on this computer.");
            return;
        }

        model.status.addMsg(portNames.length + " COM port(s) found.");
        foundComPortsComboBox.getItems().addAll(portNames);

        // Select first one in list for convenience
        foundComPortsComboBox.getSelectionModel().select(0);
    }

    public void setComPortManager(ComPortManager comPortManager) {
        this.comPortManager = comPortManager;
    }

}
