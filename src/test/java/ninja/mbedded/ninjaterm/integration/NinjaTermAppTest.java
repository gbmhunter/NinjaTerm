//package ninja.mbedded.ninjaterm.integration;
//
//
//import javafx.application.Platform;
//import javafx.fxml.FXMLLoader;
//import javafx.scene.Parent;
//import javafx.scene.Scene;
//import javafx.stage.Stage;
//import ninja.mbedded.ninjaterm.model.Model;
//import ninja.mbedded.ninjaterm.util.comport.ComPort;
//import ninja.mbedded.ninjaterm.util.comport.ComPortFactory;
//import ninja.mbedded.ninjaterm.view.mainWindow.MainWindowViewController;
//import org.controlsfx.glyphfont.GlyphFont;
//import org.junit.Test;
//import org.testfx.framework.junit.ApplicationTest;
//
//import java.io.IOException;
//
//import static junit.framework.TestCase.assertEquals;
//import static org.mockito.Mockito.mock;
//import static org.mockito.Mockito.*;
//import static org.testfx.api.FxAssert.verifyThat;
//import static org.testfx.matcher.base.NodeMatchers.hasText;
//
///**
// * Created by gbmhu on 2016-10-28.
// */
//public class NinjaTermAppTest extends ApplicationTest {
//
//    Model model;
//    MainWindowViewController mainWindowViewController;
//
//
//    @Override
//    public void start(Stage stage) {
//
//        //==============================================//
//        //==== MOCK COMPORT FACTORY AND COM PORT =======//
//        //==============================================//
//
//        GlyphFont glyphFont = new GlyphFont("FontAwesome", 12, "/ninja/mbedded/ninjaterm/resources/fontawesome-webfont.ttf");
//
//        ComPort comPort = mock(ComPort.class);
//        when(comPort.scan()).thenReturn(new String[]{"COM1", "COM2"});
//
//        ComPortFactory comPortFactory = mock(ComPortFactory.class);
//        when(comPortFactory.create()).thenReturn(comPort);
//
//
//        // Create application model (data/state)
//        model = new Model(comPortFactory);
//
//        FXMLLoader loader = new FXMLLoader(getClass().getResource("/ninja/mbedded/ninjaterm/view/mainWindow/MainWindowView.fxml"));
//        try {
//            Parent root = loader.load();
//        } catch (IOException e) {
//            return;
//        }
//        mainWindowViewController = loader.getController();
//
//        mainWindowViewController.init(model, glyphFont);
//
//        //mainWindowViewController.addNewTerminal();
//
//
//        Scene scene = new Scene(mainWindowViewController.mainVBox, 1000, 800);
//        stage.setScene(scene);
//        stage.show();
//
//        model.createTerminal();
//    }
//
//    @Test
//    public void basicTest() {
//
//        Platform.runLater(() -> {
//            // given:
//            //rightClickOn("#mainVBox").moveTo("New").clickOn("Text Document");
//            //write("myTextfile.txt").push(ENTER);
//
//
//
//            // Make sure there is one terminal by default
//            assertEquals(1, mainWindowViewController.terminalViewControllers.size());
//
//            // Make sure the open/close COM port button says "Open" by default, and is currently disabled
//            verifyThat(mainWindowViewController.terminalViewControllers.get(0).txRxViewController.openCloseComPortButton, hasText("Open"));
//            //assertEquals(true, mainWindowViewController.statusBarViewController.openCloseComPortButton.isDisable());
//
//            //clickOn();
//
//            int numOfChildrenBeforeAction = mainWindowViewController.statusBarViewController.statusTextFlow.getChildren().size();
//
//            // Hit the scan button
//            mainWindowViewController.terminalViewControllers.get(0).comSettingsViewController.reScanButton.fire();
//
//            assertEquals(numOfChildrenBeforeAction + 1, mainWindowViewController.statusBarViewController.statusTextFlow.getChildren().size());
//
//
//            // Click on the button
//            //clickOn(mainWindowViewController.terminalViewControllers);
//
//
//            // then:
//        });
//
//    }
//}
