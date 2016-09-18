package ninja.mbedded.ninjaterm.view.mainwindow.StatusBar;

import javafx.animation.*;
import javafx.beans.value.ObservableValue;
import javafx.collections.ListChangeListener;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.Node;
import javafx.scene.canvas.GraphicsContext;
import javafx.scene.paint.Color;
import javafx.scene.shape.Circle;
import javafx.scene.text.Text;
import javafx.scene.text.TextFlow;
import javafx.util.Duration;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.globalStats.GlobalStats;
import ninja.mbedded.ninjaterm.view.led.Led;

import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.ResourceBundle;

/**
 * Controller for the "Status Bar" which is part of the main window.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-07-10
 * @last-modified   2016-07-17
 */
public class StatusBarController implements Initializable {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    public TextFlow statusTextFlow;

    @FXML
    public Led activityTxLed;

    @FXML
    public Led activityRxLed;

    public Model model;

    @Override
    public void initialize(URL location, ResourceBundle resources) {

    }

    public void init(Model model) {
        this.model = model;

        model.globalStats.numCharactersTx.addListener((observable, oldValue, newValue) -> {
            activityTxLed.flash();
        });

        model.globalStats.numCharactersRx.addListener((observable, oldValue, newValue) -> {
            activityRxLed.flash();
        });

        model.status.statusMsgs.addListener((ListChangeListener.Change<? extends Node> c) -> {
            statusTextFlow.getChildren().setAll(model.status.statusMsgs);
        });

    }



}
