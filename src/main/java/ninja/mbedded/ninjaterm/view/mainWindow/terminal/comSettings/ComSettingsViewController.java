package ninja.mbedded.ninjaterm.view.mainWindow.terminal.comSettings;

import javafx.collections.ListChangeListener;
import javafx.fxml.FXML;
import javafx.geometry.Insets;
import javafx.scene.control.Button;
import javafx.scene.control.ComboBox;
import javafx.scene.layout.Background;
import javafx.scene.layout.BackgroundFill;
import javafx.scene.layout.CornerRadii;
import javafx.scene.paint.Color;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.util.comPort.BaudRates;
import ninja.mbedded.ninjaterm.util.comPort.NumDataBits;
import ninja.mbedded.ninjaterm.util.comPort.NumStopBits;
import ninja.mbedded.ninjaterm.util.comPort.Parities;
import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import ninja.mbedded.ninjaterm.util.tooltip.TooltipUtil;
import org.controlsfx.glyphfont.FontAwesome;
import org.controlsfx.glyphfont.GlyphFont;
import org.slf4j.Logger;

import java.awt.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Controller for the "COM Settings tab" which is part of the main window.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @last-modified 2017-02-08
 * @since 2016-07-10
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
    public ComboBox<String> baudRateComboBox;

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
    private Terminal terminal;

    private GlyphFont glyphFont;

    private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public ComSettingsViewController() {
    }

    public void init(Model model, Terminal terminal, GlyphFont glyphFont) {

        this.model = model;
        this.terminal = terminal;
        this.glyphFont = glyphFont;

        // Attach handler for "Scan" button press
        reScanButton.setOnAction((actionEvent) -> {
            scanButtonPressed();
        });

        //==============================================//
        //=========== POPULATE/BIND COMBOBOXES =========//
        //==============================================//

        terminal.comPortSettings.selComPortName.bind(foundComPortsComboBox.getSelectionModel().selectedItemProperty());

        List<String> test = new ArrayList<String>();
        test.add("123");

        baudRateComboBox.getItems().setAll(test);
        baudRateComboBox.getSelectionModel().select("124");
        // Don't add a listener to the combobox valueProperty(), as it is only called once the value is committed
        // (i.e. enter is pressed). Instead, listen to the textProperty of the "editor" component of the combobox instead
        baudRateComboBox.getEditor().textProperty().addListener((observable, oldValue, newValue) -> {
            baudRateComboBoxChangeHandler(newValue);
        });

        numDataBitsComboBox.getItems().setAll(NumDataBits.values());
        numDataBitsComboBox.getSelectionModel().select(NumDataBits.EIGHT);
        terminal.comPortSettings.selNumDataBits.bind(numDataBitsComboBox.getSelectionModel().selectedItemProperty());

        parityComboBox.getItems().setAll(Parities.values());
        parityComboBox.getSelectionModel().select(Parities.NONE);
        terminal.comPortSettings.selParity.bind(parityComboBox.getSelectionModel().selectedItemProperty());

        numStopBitsComboBox.getItems().setAll(NumStopBits.values());
        numStopBitsComboBox.getSelectionModel().select(NumStopBits.ONE);
        terminal.comPortSettings.selNumStopBits.bind(numStopBitsComboBox.getSelectionModel().selectedItemProperty());

        //==============================================//
        //====== ATTACH LISTENERS TO COM PORT SCAN =====//
        //==============================================//

        terminal.comPortSettings.scannedComPorts.addListener(
                (ListChangeListener.Change<? extends String> c) -> {
                    handleComPortsScanned();
                });

        //==============================================//
        //=== ATTACH LISTENERS TO COM PORT OPEN/CLOSE ==//
        //==============================================//

        terminal.isComPortOpen.addListener((observable, oldValue, newValue) -> {
            onIsComPortOpen();
        });

        // Set default style for OpenClose button
        setOpenCloseComPortButtonStyle(OpenCloseButtonStyles.OPEN);

        // Attach handler for when selected COM port changes. This is responsible for
        // enabling/disabling the "Open" button as appropriate
        terminal.comPortSettings.selComPortName.addListener(
                (observable, oldValue, newValue) -> {
                    logger.debug("Selected COM port name changed.");

                    // newValue will be null if a scan was done and no COM ports
                    // were found
                    if (newValue == null) {
                        openCloseComPortButton.setDisable(true);
                    } else {
                        openCloseComPortButton.setDisable(false);
                    }
                });
    }

    private void baudRateComboBoxChangeHandler(String newValue) {
        // Convert baud rate from string to double
        try {
            Double baudRateDouble = Double.parseDouble(newValue);
            terminal.comPortSettings.selBaudRate.set(baudRateDouble);
            if (baudRateComboBox.getStyleClass().contains("error")) {
                baudRateComboBox.getStyleClass().remove("error");
            }
        } catch (NumberFormatException e) {
            model.status.addMsg("ERROR: Baud rate is not a valid number (must be convertable to double).");
            TooltipUtil.addDefaultTooltip(baudRateComboBox, "Baud rate is not a valid number (must be convertable to double).");
            baudRateComboBox.getStyleClass().add("error");
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

    /**
     * Handler that gets called when the terminal.isComPortOpen property
     * changes value.
     */
    private void onIsComPortOpen() {
        if(terminal.isComPortOpen.get()) {
            setOpenCloseComPortButtonStyle(OpenCloseButtonStyles.CLOSE);

            reScanButton.setDisable(true);
            foundComPortsComboBox.setDisable(true);
            baudRateComboBox.setDisable(true);
            numDataBitsComboBox.setDisable(true);
            parityComboBox.setDisable(true);
            numStopBitsComboBox.setDisable(true);
        } else {
            setOpenCloseComPortButtonStyle(OpenCloseButtonStyles.OPEN);

            reScanButton.setDisable(false);
            foundComPortsComboBox.setDisable(false);
            baudRateComboBox.setDisable(false);
            numDataBitsComboBox.setDisable(false);
            parityComboBox.setDisable(false);
            numStopBitsComboBox.setDisable(false);
        }
    }


    private void scanButtonPressed() {
        logger.debug("Scan button pressed.");

        //        logger.debug(this.getClass().getName() + ".scanComPorts() called.");
        terminal.comPortSettings.scanComPorts();
    }

    private void handleComPortsScanned() {
        // Clear any existing COM ports that are in the combobox from a previous scan
        foundComPortsComboBox.getItems().clear();

        foundComPortsComboBox.getItems().addAll(terminal.comPortSettings.scannedComPorts);

        // Select first one in list for convenience
        foundComPortsComboBox.getSelectionModel().select(0);
    }

}
