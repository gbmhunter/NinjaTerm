package ninja.mbedded.ninjaterm.view.mainWindow.terminal.logging;

import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Button;
import javafx.scene.control.Tab;
import javafx.scene.control.TextField;
import javafx.stage.FileChooser;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import org.controlsfx.glyphfont.FontAwesome;
import org.controlsfx.glyphfont.GlyphFont;

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

    @FXML
    private Button startStopLoggingButton;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    private Model model;
    private Terminal terminal;

    private GlyphFont glyphFont;

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

    public void init(Model model, Terminal terminal, GlyphFont glyphFont) {

        this.model = model;
        this.terminal = terminal;

        this.glyphFont = glyphFont;

        //==============================================//
        //============= LOG FILE PATH SETUP ============//
        //==============================================//

        // Bind the log file path textfield to a string in the model
        logFilePathTextField.textProperty().bindBidirectional(terminal.logging.logFilePath);

        browseButton.setOnAction(event -> {
            openFileChooser();
        });

        startStopLoggingButton.setOnAction(event -> {
            // Toggle the isLogging boolean in the model
            if(!terminal.logging.isLogging.get()) {
                terminal.logging.enableLogging();
            } else {
                terminal.logging.disableLogging();
            }
            updateLoggingTabBasedOnIsLogging();
        });

        // Update the button style based on the default value for isLogging in the model.
        updateLoggingTabBasedOnIsLogging();

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


    private void updateLoggingTabBasedOnIsLogging() {
        if(!terminal.logging.isLogging.get()) {
            startStopLoggingButton.setGraphic(glyphFont.create(FontAwesome.Glyph.PLAY));
            startStopLoggingButton.setText("Start");
            startStopLoggingButton.getStyleClass().remove("failure");
            startStopLoggingButton.getStyleClass().add("success");

            // Disable certain controls
            logFilePathTextField.setDisable(false);
            browseButton.setDisable(false);

        } else {
            startStopLoggingButton.setGraphic(glyphFont.create(FontAwesome.Glyph.STOP));
            startStopLoggingButton.setText("Stop");
            startStopLoggingButton.getStyleClass().remove("success");
            startStopLoggingButton.getStyleClass().add("failure");

            // Enable certain controls
            logFilePathTextField.setDisable(true);
            browseButton.setDisable(true);
        }
    }

}
