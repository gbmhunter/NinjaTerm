package ninja.mbedded.ninjaterm.integration;


import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.text.TextFlow;
import javafx.stage.Stage;
import ninja.mbedded.ninjaterm.managers.ComPortManager;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.view.mainWindow.MainWindowViewController;
import org.controlsfx.glyphfont.GlyphFont;
import org.junit.Test;
import org.testfx.framework.junit.ApplicationTest;

import java.io.IOException;

import static javafx.scene.input.KeyCode.ENTER;
import static org.testfx.api.FxAssert.verifyThat;
import static org.testfx.matcher.base.NodeMatchers.hasChildren;
import static org.testfx.matcher.base.NodeMatchers.hasText;

import org.testfx.service.finder.*;

/**
 * Created by gbmhu on 2016-10-28.
 */
public class NinjaTermAppTest extends ApplicationTest {

    Model model;
    MainWindowViewController mainWindowViewController;


    @Override
    public void start(Stage stage) {

        GlyphFont glyphFont = new GlyphFont("FontAwesome", 12, "/ninja/mbedded/ninjaterm/resources/fontawesome-webfont.ttf");

        // Create application model (data/state)
        model = new Model();

        FXMLLoader loader = new FXMLLoader(getClass().getResource("/ninja/mbedded/ninjaterm/view/mainWindow/MainWindowView.fxml"));
        try {
            Parent root = loader.load();
        } catch (IOException e) {
            return;
        }
        mainWindowViewController = loader.getController();

        mainWindowViewController.init(model, glyphFont, new ComPortManager());

        //mainWindowViewController.addNewTerminal();


        Scene scene = new Scene(mainWindowViewController.mainVBox, 1000, 800);
        stage.setScene(scene);
        stage.show();
    }

    @Test
    public void basicTest() {
        // given:
        //rightClickOn("#mainVBox").moveTo("New").clickOn("Text Document");
        //write("myTextfile.txt").push(ENTER);

        // Make sure the open/close COM port button says "Open" by default
        verifyThat("#openCloseComPortButton", hasText("Open"));

        // Click on the button
        clickOn("#openCloseComPortButton");

        TextFlow statusTextFlow = (TextFlow)lookup("#statusTextFlow").queryFirst();

        // then:
        //verifyThat("#statusTextFlow", hasChildren(0, ".file"));
    }
}
