package ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx.macros;

import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.TextField;
import javafx.scene.input.MouseButton;
import javafx.scene.input.MouseEvent;
import javafx.stage.Modality;
import javafx.stage.Stage;
import javafx.stage.WindowEvent;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx.macros.macroSettingsWindow.MacroSettingsViewController;
import org.controlsfx.glyphfont.FontAwesome;
import org.controlsfx.glyphfont.GlyphFont;

import java.io.IOException;

/**
 * Created by gbmhu on 2016-11-07.
 */
public class MacroRow {

    Model model;

    public TextField name = new TextField();
    public TextField sequence = new TextField();
    public Button sendButton = new Button();

    public MacroRow(Model model, GlyphFont glyphFont) {

        this.model = model;

        name.setPrefWidth(50);
        sequence.setPrefWidth(80);

        sendButton.setGraphic(glyphFont.create(FontAwesome.Glyph.SHARE_SQUARE));

        // INSTALL DOUBLE-CLICK HANDLERS
        name.setOnMouseClicked((MouseEvent mouseEvent) -> {
            if (mouseEvent.getButton().equals(MouseButton.PRIMARY)) {
                if (mouseEvent.getClickCount() == 2) {
                    System.out.println("Node was double clicked.");
                    // Create and show the macro settings window
                    showMacroSettingsWindow();
                }
            }
        });
    }

    public void showMacroSettingsWindow() {
        final Stage stage = new Stage();
        stage.initModality(Modality.APPLICATION_MODAL);
        //stage.initOwner(primaryStage);

        FXMLLoader loader = new FXMLLoader(
                getClass().getResource("macroSettingsWindow/MacroSettingsView.fxml"));
        Parent root;
        try {
            root = loader.load();
        } catch (IOException e) {
            return;
        }
        MacroSettingsViewController macroSettingsViewController = loader.getController();

        //mainWindowViewController.init(model, glyphFont);

        // Blur the main window
        model.isPrimaryStageBlurred.set(true);

        // Make sure main window is un-blurred when dialogue closes
        stage.setOnCloseRequest(event -> {
            model.isPrimaryStageBlurred.set(false);
        });

        Scene dialogScene = new Scene(root, 300, 200);
        stage.setScene(dialogScene);

        macroSettingsViewController.cancelButton.setOnAction(event -> {
            // This closes the stage the "clean" way, which causes all OnCloseRequest event handler
            // to be called correctly
            stage.fireEvent(
                    new WindowEvent(
                            stage,
                            WindowEvent.WINDOW_CLOSE_REQUEST
                    )
            );
        });


        stage.show();
    }
}
