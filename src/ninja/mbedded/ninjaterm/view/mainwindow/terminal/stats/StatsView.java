package ninja.mbedded.ninjaterm.view.mainwindow.terminal.stats;

import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Label;
import javafx.scene.layout.VBox;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.stats.Stats;

import java.io.IOException;

/**
 * Controller for the "StatsView" sub-tab which is part of a terminal tab.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-09-16
 * @last-modified 2016-09-16
 */
public class StatsView extends VBox {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    public Label characterCountTxLabel;

    @FXML
    public Label characterCountRxLabel;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    private Stats stats;

    public StatsView() {

        FXMLLoader fxmlLoader = new FXMLLoader(getClass().getResource(
                "StatsView.fxml"));

        fxmlLoader.setRoot(this);
        fxmlLoader.setController(this);

        try {
            fxmlLoader.load();
        } catch (IOException exception) {
            throw new RuntimeException(exception);
        }

    }

    public void init(Stats stats) {

        this.stats = stats;

        //======================= RX ===================//
        characterCountTxLabel.setText(Integer.toString(stats.numCharactersTx.getValue()));
        stats.numCharactersTx.addListener((observable, oldValue, newValue) -> {
            // Convert new value into string and update label
            characterCountTxLabel.setText(Integer.toString(newValue.intValue()));
        });

        //======================= TX ===================//
        characterCountRxLabel.setText(Integer.toString(stats.numCharactersRx.getValue()));
        stats.numCharactersRx.addListener((observable, oldValue, newValue) -> {
            // Convert new value into string and update label
            characterCountRxLabel.setText(Integer.toString(newValue.intValue()));
        });

    }

}
