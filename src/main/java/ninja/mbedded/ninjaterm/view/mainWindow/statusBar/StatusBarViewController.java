package ninja.mbedded.ninjaterm.view.mainWindow.statusBar;

import javafx.beans.property.SimpleDoubleProperty;
import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.value.ChangeListener;
import javafx.collections.ListChangeListener;
import javafx.fxml.FXML;
import javafx.scene.Node;
import javafx.scene.control.Label;
import javafx.scene.control.ScrollPane;
import javafx.scene.text.TextFlow;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.util.javafx.led.Led;
import org.controlsfx.glyphfont.GlyphFont;

/**
 * Controller for the "Status Bar" which is part of the main window.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-07-10
 * @last-modified   2016-11-05
 */
public class StatusBarViewController {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    private ScrollPane statusScrollPane;

    @FXML
    public TextFlow statusTextFlow;

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

    @FXML
    private Label processCpuLoadPerc;

    @FXML
    private Label systemCpuLoadPerc;


    private Model model;
    private GlyphFont glyphFont;


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

        // CPU LOAD SETUP

        model.globalStats.processCpuLoad.addListener((observable, oldValue, newValue) -> {
            processCpuLoadPerc.setText(String.format("%.0f", newValue.doubleValue()*100.0) + "%");
        });
        processCpuLoadPerc.setText(String.format("%.0f", model.globalStats.processCpuLoad.get()*100.0) + "%");

        model.globalStats.systemCpuLoad.addListener((observable, oldValue, newValue) -> {
            systemCpuLoadPerc.setText(String.format("%.0f", newValue.doubleValue()*100.0) + "%");
        });
        systemCpuLoadPerc.setText(String.format("%.0f", model.globalStats.systemCpuLoad.get()*100.0) + "%");

    }

}
