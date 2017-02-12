package ninja.mbedded.ninjaterm.integration;


import javafx.application.Platform;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.ComboBox;
import javafx.stage.Stage;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.util.comPort.ComPort;
import ninja.mbedded.ninjaterm.util.comPort.ComPortFactory;
import ninja.mbedded.ninjaterm.util.comPort.OnRxDataListener;
import ninja.mbedded.ninjaterm.view.mainWindow.MainWindowViewController;
import ninja.mbedded.ninjaterm.view.mainWindow.terminal.TerminalViewController;
import org.controlsfx.glyphfont.GlyphFont;
import org.junit.Test;
import org.testfx.framework.junit.ApplicationTest;

import java.io.IOException;
import java.util.ArrayList;

import static junit.framework.TestCase.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.*;
import static org.testfx.api.FxAssert.verifyThat;
import static org.testfx.matcher.base.NodeMatchers.hasText;

/**
 * A basic integration test that starts up an instance of the NinjaTerm app
 * with a mocked COM port, and makes sure that the app responds correctly.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-10-28
 * @last-modified   2017-02-08
 */
public class NinjaTermAppTest extends ApplicationTest {

    Model model;
    MainWindowViewController mainWindowViewController;


    @Override
    public void start(Stage stage) {

        //==============================================//
        //==== MOCK COMPORT FACTORY AND COM PORT =======//
        //==============================================//

        GlyphFont glyphFont = new GlyphFont("FontAwesome", 12, "/ninja/mbedded/ninjaterm/resources/fontawesome-webfont.ttf");

        ComPort comPort = mock(ComPort.class);
        when(comPort.scan()).thenReturn(new String[]{"COM1", "COM2"});

        //======== CREATE MOCK RX DATA LISTENER ========//
        OnRxDataListener onRxDataListener = (byte[] rxData) -> {

        };
        ArrayList<OnRxDataListener> onRxDataListeners = new ArrayList();
        onRxDataListeners.add(onRxDataListener);
        when(comPort.getOnRxDataListeners()).thenReturn(onRxDataListeners);

        ComPortFactory comPortFactory = mock(ComPortFactory.class);
        when(comPortFactory.create()).thenReturn(comPort);


        // Create application model (data/state)
        model = new Model(comPortFactory);

        FXMLLoader loader = new FXMLLoader(getClass().getResource("/ninja/mbedded/ninjaterm/view/mainWindow/MainWindowView.fxml"));
        try {
            Parent root = loader.load();
        } catch (IOException e) {
            return;
        }
        mainWindowViewController = loader.getController();

        mainWindowViewController.init(model, glyphFont, stage);

        Scene scene = new Scene(mainWindowViewController.mainVBox, 1000, 800);
        stage.setScene(scene);
        stage.show();

        model.createTerminal();
    }

    @Test
    public void basicTest() {

        Platform.runLater(() -> {
            // given:
            //rightClickOn("#mainVBox").moveTo("New").clickOn("Text Document");
            //write("myTextfile.txt").push(ENTER);

            // Make sure there is one terminal by default
            assertEquals(1, mainWindowViewController.terminalViewControllers.size());

            // Make sure the open/close COM port button says "Open" by default, and is currently disabled
            verifyThat(mainWindowViewController.terminalViewControllers.get(0).txRxViewController.openCloseComPortButton, hasText("Open"));
            //assertEquals(true, mainWindowViewController.statusBarViewController.openCloseComPortButton.isDisable());

            //clickOn();

            int numOfChildrenBeforeAction = mainWindowViewController.statusBarViewController.statusTextFlow.getChildren().size();

            TerminalViewController terminalViewController = mainWindowViewController.terminalViewControllers.get(0);

            // Hit the scan button
            terminalViewController.comSettingsViewController.reScanButton.fire();

            assertEquals(numOfChildrenBeforeAction + 1, mainWindowViewController.statusBarViewController.statusTextFlow.getChildren().size());

            // Check drop-down box has two COM ports listed, and their names are correct
            ComboBox<String> comboBox = terminalViewController.comSettingsViewController.foundComPortsComboBox;
            assertEquals(2, comboBox.getItems().size());
            assertEquals("COM1", comboBox.getItems().get(0));
            assertEquals("COM2", comboBox.getItems().get(1));

            // Select COM1 and open
            comboBox.getSelectionModel().select(comboBox.getItems().get(0));
            assertEquals(false, model.terminals.get(0).isComPortOpen.get());
            terminalViewController.comSettingsViewController.openCloseComPortButton.fire();
            assertEquals(true, model.terminals.get(0).isComPortOpen.get());

            // COM1 is open, make sure COM port settings are now greyed out
            assertEquals(true, terminalViewController.comSettingsViewController.reScanButton.isDisabled());
            assertEquals(true, terminalViewController.comSettingsViewController.foundComPortsComboBox.isDisabled());
            assertEquals(true, terminalViewController.comSettingsViewController.baudRateComboBox.isDisabled());
            assertEquals(true, terminalViewController.comSettingsViewController.numDataBitsComboBox.isDisabled());
            assertEquals(true, terminalViewController.comSettingsViewController.parityComboBox.isDisabled());
            assertEquals(true, terminalViewController.comSettingsViewController.numStopBitsComboBox.isDisabled());

        });

    }
}
