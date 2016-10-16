package ninja.mbedded.ninjaterm.view.mainWindow.statusBar;

import javafx.beans.property.SimpleDoubleProperty;
import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.value.ChangeListener;
import javafx.collections.ListChangeListener;
import javafx.fxml.FXML;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.ScrollPane;
import javafx.scene.text.TextFlow;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.model.terminal.txRx.RawDataReceivedListener;
import ninja.mbedded.ninjaterm.view.led.Led;
import ninja.mbedded.ninjaterm.view.mainWindow.terminal.comSettings.ComSettingsViewController;
import org.controlsfx.glyphfont.FontAwesome;
import org.controlsfx.glyphfont.GlyphFont;

import java.util.List;

/**
 * Controller for the "Status Bar" which is part of the main window.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-07-10
 * @last-modified   2016-10-07
 */
public class StatusBarViewController {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    private ScrollPane statusScrollPane;

    @FXML
    private TextFlow statusTextFlow;

    @FXML
    private Button openCloseComPortButton;

    @FXML
    private Led activityTxLed;

    @FXML
    private Led activityRxLed;

    //==============================================//
    //================ BOTTOM BAR ==================//
    //==============================================//

    @FXML
    private Label totalByteCountTx;

    @FXML
    private Label totalByteCountRx;

    @FXML
    private Label totalBytesPerSecTx;

    @FXML
    private Label totalBytesPerSecRx;


    private Model model;
    private GlyphFont glyphFont;

    private ChangeListener<? super Boolean> openCloseChangeListener;


    public void init(Model model, GlyphFont glyphFont) {
        this.model = model;
        this.glyphFont = glyphFont;

        //==============================================//
        //============= STATUS MESSAGES SETUP ==========//
        //==============================================//

        model.status.statusMsgs.addListener((ListChangeListener.Change<? extends Node> c) -> {
            statusTextFlow.getChildren().setAll(model.status.statusMsgs);

            // Auto-scroll the status scroll-pane to the last received status message
            statusScrollPane.setVvalue(statusTextFlow.getHeight());
        });

        //==============================================//
        //====== OPEN/CLOSE COM PORT BUTTON SETUP ======//
        //==============================================//

        openCloseComPortButton.setGraphic(glyphFont.create(FontAwesome.Glyph.PLAY));
        openCloseComPortButton.setText("Open");

        openCloseComPortButton.setOnAction(event -> {
            model.openOrCloseCurrentComPort();
        });

        // Create a listener which refreshes the open/close COM port button
        openCloseChangeListener = (observable, oldValue, newValue) -> {
            refreshOpenCloseButton();
        };

        model.selTerminal.addListener((observable, oldValue, newValue) -> {

            if(oldValue != null) {
                oldValue.isComPortOpen.removeListener(openCloseChangeListener);
            }

            newValue.isComPortOpen.addListener(openCloseChangeListener);

            // Refresh the style of the open/close COM port button when the selected
            // terminal changes (i.e. when the user selects a different terminal tab)
            refreshOpenCloseButton();
        });

        //==============================================//
        //================= LED SETUP ==================//
        //==============================================//

        model.globalStats.numCharactersTx.addListener((observable, oldValue, newValue) -> {
            activityTxLed.flash();
        });

        model.globalStats.numCharactersRx.addListener((observable, oldValue, newValue) -> {
            activityRxLed.flash();
        });

        //==============================================//
        //============ TOTAL BYTE COUNT SETUP ==========//
        //==============================================//

        //======================= TX ===================//
        ChangeListener<Number> totalByteCountTxChangeListener = (observable, oldValue, newValue) -> {
            totalByteCountTx.setText(Integer.toString(newValue.intValue()));
        };
        model.status.totalByteCountTx.addListener(totalByteCountTxChangeListener);

        // Set default (giving bogus data as it is not used)
        totalByteCountTxChangeListener.changed(new SimpleIntegerProperty(), 0.0, 0.0);

        //======================= RX ===================//
        ChangeListener<Number> totalByteCountRxChangeListener = (observable, oldValue, newValue) -> {
            totalByteCountRx.setText(Integer.toString(newValue.intValue()));
        };
        model.status.totalByteCountRx.addListener(totalByteCountRxChangeListener);

        // Set default (giving bogus data as it is not used)
        totalByteCountRxChangeListener.changed(new SimpleIntegerProperty(), 0.0, 0.0);


        //==============================================//
        //=========== TOTAL BYTES/SECOND SETUP =========//
        //==============================================//

        //======================= TX ===================//
        ChangeListener<Number> totalBytesPerSecTxChangeListener = (observable, oldValue, newValue) -> {
            totalBytesPerSecTx.setText(Double.toString(newValue.doubleValue()));
        };
        model.status.totalBytesPerSecTx.addListener(totalBytesPerSecTxChangeListener);

        // Set default (giving bogus data as it is not used)
        totalBytesPerSecTxChangeListener.changed(new SimpleDoubleProperty(), 0.0, 0.0);

        //======================= RX ===================//
        ChangeListener<Number> totalBytesPerSecRxChangeListener = (observable, oldValue, newValue) -> {
            totalBytesPerSecRx.setText(Double.toString(newValue.doubleValue()));
        };
        model.status.totalBytesPerSecRx.addListener(totalBytesPerSecRxChangeListener);

        // Set default (giving bogus data as it is not used)
        totalBytesPerSecRxChangeListener.changed(new SimpleDoubleProperty(), 0.0, 0.0);
    }

    /**
     * This updates the styling of the Open/Close COM port button based on whether the currently
     * selected terminal in the model has a open or closed COM port.
     */
    private void refreshOpenCloseButton() {
        if (!model.selTerminal.get().isComPortOpen.get()) {
            openCloseComPortButton.setGraphic(glyphFont.create(FontAwesome.Glyph.PLAY));
            openCloseComPortButton.setText("Open");
            openCloseComPortButton.getStyleClass().remove("failure");
            openCloseComPortButton.getStyleClass().add("success");
        } else {
            openCloseComPortButton.setGraphic(glyphFont.create(FontAwesome.Glyph.STOP));
            openCloseComPortButton.setText("Close");
            openCloseComPortButton.getStyleClass().remove("success");
            openCloseComPortButton.getStyleClass().add("failure");
        }
    }

}
