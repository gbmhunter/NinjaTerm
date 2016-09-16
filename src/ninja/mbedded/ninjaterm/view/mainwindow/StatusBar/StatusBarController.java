package ninja.mbedded.ninjaterm.view.mainwindow.StatusBar;

import javafx.animation.*;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.canvas.GraphicsContext;
import javafx.scene.paint.Color;
import javafx.scene.shape.Circle;
import javafx.scene.text.Text;
import javafx.scene.text.TextFlow;
import javafx.util.Duration;
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

    public GlobalStats globalStats;

    @Override
    public void initialize(URL location, ResourceBundle resources) {

    }

    public void init(GlobalStats globalStats) {
        this.globalStats = globalStats;

        globalStats.numCharactersTx.addListener((observable, oldValue, newValue) -> {
            activityTxLed.flash();
        });

        globalStats.numCharactersRx.addListener((observable, oldValue, newValue) -> {
            activityRxLed.flash();
        });

    }

    /**
     * Prints the given message to the status window. This prepends the current date/time to the massage
     * as well as adding a carriage return and new-line character to the end of the message.
     * @param msg   The message you want to print.
     */
    public void addMsg(String msg) {

        // Build up a string of the current date/time (incl. milli-seconds)
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS");
        Date date = new Date();
        String dateString = sdf.format(date);

        statusTextFlow.getChildren().add(new Text(dateString + ": " + msg + "\r\n"));
    }

    /**
     * Prints the given error message to the status window. This prepends the current date/time to the massage
     * as well as adding a carriage return and new-line character to the end of the message.
     * @param msg   The error message you want to print.
     */
    public void addErr(String msg) {

        // Build up a string of the current date/time (incl. milli-seconds)
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS");
        Date date = new Date();
        String dateString = sdf.format(date);

        Text text = new Text(dateString + ": ERROR. " + msg + "\r\n");
        text.setFill(Color.RED);
        statusTextFlow.getChildren().add(text);
    }

}
