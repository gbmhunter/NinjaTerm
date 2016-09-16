package ninja.mbedded.ninjaterm.view.led;

import javafx.animation.FadeTransition;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.fxml.Initializable;
import javafx.scene.control.Label;
import javafx.scene.layout.Pane;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.scene.shape.Circle;
import javafx.util.Duration;
import ninja.mbedded.ninjaterm.model.terminal.stats.Stats;

import java.io.IOException;
import java.net.URL;
import java.util.ResourceBundle;

/**
 * Controller for the "StatsView" sub-tab which is part of a terminal tab.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-09-16
 * @last-modified 2016-09-16
 */
public class Led extends StackPane {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    public Circle ledCircle;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    public void setColor(Color color) {
        ledCircle.setFill(color);
    }

    public Color getColor() {
        return (Color)ledCircle.getFill();
    }

    private FadeTransition fade;

    public Led() {
        FXMLLoader fxmlLoader = new FXMLLoader(getClass().getResource(
                "LedView.fxml"));

        fxmlLoader.setRoot(this);
        fxmlLoader.setController(this);

        try {
            fxmlLoader.load();
        } catch (IOException exception) {
            throw new RuntimeException(exception);
        }

        fade = new FadeTransition(Duration.seconds(0.3), ledCircle);
        fade.setFromValue(1);
        fade.setToValue(0);
        //fade.setAutoReverse(true);
        fade.setCycleCount(1);
    }

    public void init() {

    }

    public void flash() {
        fade.stop();
        fade.play();
    }

}
