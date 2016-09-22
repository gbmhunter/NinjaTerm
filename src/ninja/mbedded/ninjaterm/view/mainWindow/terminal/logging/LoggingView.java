package ninja.mbedded.ninjaterm.view.mainWindow.terminal.logging;

import javafx.beans.property.SimpleStringProperty;
import javafx.beans.value.ChangeListener;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.Tab;
import javafx.scene.control.TextField;
import javafx.scene.layout.VBox;
import javafx.stage.FileChooser;
import javafx.stage.Stage;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;

import java.io.File;
import java.io.IOException;

/**
 * Controller for the "StatsView" sub-tab which is part of a terminal tab.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-09-16
 * @last-modified 2016-09-22
 */
public class LoggingView extends Tab {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    private TextField logFilePathTextField;

    @FXML
    private Button browseButton;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    private Model model;
    private Terminal terminal;

    public LoggingView() {

        FXMLLoader fxmlLoader = new FXMLLoader(getClass().getResource(
                "LoggingView.fxml"));

        fxmlLoader.setRoot(this);
        fxmlLoader.setController(this);

        try {
            fxmlLoader.load();
        } catch (IOException exception) {
            throw new RuntimeException(exception);
        }

    }

    public void init(Model model, Terminal terminal) {

        this.model = model;
        this.terminal = terminal;

        //==============================================//
        //============= LOG FILE PATH SETUP ============//
        //==============================================//

        // Bind the log file path textfield to a string in the model
        logFilePathTextField.textProperty().bindBidirectional(terminal.logging.logFilePath);

        browseButton.setOnAction(event -> {
            openFileChooser();
        });

    }

    private void openFileChooser() {
        FileChooser fileChooser = new FileChooser();
        fileChooser.setTitle("Select Log File");
        File selectedFile = fileChooser.showOpenDialog(browseButton.getScene().getWindow());

        if(selectedFile == null) {
            model.status.addErr("Selected log file path was invalid.");
            return;
        }

        // If we reach here, a valid log file must of been chosen. Save to model.
        terminal.logging.logFilePath.set(selectedFile.getAbsolutePath());

    }

}
