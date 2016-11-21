import javafx.application.Application;
import javafx.application.Platform;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.input.KeyEvent;
import javafx.scene.paint.Color;
import javafx.stage.Stage;
import javafx.stage.StageStyle;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.util.comport.ComPortFactory;
import ninja.mbedded.ninjaterm.util.javafx.exceptionPopup.ExceptionPopup;
import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import ninja.mbedded.ninjaterm.util.stringUtils.StringUtils;
import ninja.mbedded.ninjaterm.view.mainWindow.MainWindowViewController;
import ninja.mbedded.ninjaterm.view.splashScreen.SplashScreenViewController;
import org.controlsfx.glyphfont.GlyphFont;
import org.slf4j.Logger;

import java.io.IOException;

public class Main extends Application {

    private GlyphFont glyphFont;

    private boolean disableSplashScreen = false;

    public boolean isDebugEnabled = false;

    private Stage splashScreenStage;
    private Stage mainStage;

    private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

    @Override
    public void start(Stage primaryStage) throws Exception {

        logger.debug("start() called.");

        Thread.currentThread().setUncaughtExceptionHandler((thread, throwable) -> {
            showError(thread, throwable);
        });


        //==============================================//
        //======== COMMAND-LINE ARGUMENT PARSING =======//
        //==============================================//

        logger.debug("Parsing command-line parameters. args = " + getParameters().getRaw());
        for (String arg : getParameters().getRaw()) {
            if (arg.equals("no-splash"))
                disableSplashScreen = true;

            if (arg.equals("debug"))
                LoggerUtils.startDebuggingToFile();
        }

        if (disableSplashScreen) {
            // Skip this function, and go straight to loading the main window.
            loadMainWindow();
            return;
        }

        this.splashScreenStage = primaryStage;

        // Load splashscreen FXML file and get controller
        FXMLLoader loader = new FXMLLoader(getClass().getResource("ninja/mbedded/ninjaterm/view/splashScreen/SplashScreenView.fxml"));
        try {
            Parent root = loader.load();
        } catch (IOException e) {
            return;
        }

        SplashScreenViewController splashScreenViewController = loader.getController();
        splashScreenViewController.init();

        Scene splashScreenScene = new Scene(loader.getRoot(), 800, 600, Color.TRANSPARENT);
        splashScreenViewController.isFinished.addListener((observable, oldValue, newValue) -> {
            if (newValue) {
                loadMainWindow();
            }
        });

        primaryStage.initStyle(StageStyle.TRANSPARENT);
        primaryStage.setScene(splashScreenScene);
        primaryStage.show();

        splashScreenScene.addEventHandler(KeyEvent.KEY_PRESSED, event -> {
            //event.getCharacter();
            if (event.getCode().isWhitespaceKey()) {
                splashScreenViewController.speedUpSplashScreen();
            }
        });

        splashScreenViewController.startNameVersionInfoMsg();
    }

    public void loadMainWindow() {


        // Initialise fontAwesome glyths (these are downloaded from CDN)
        // (this old method required the internet, new method uses local font in resources)
        //glyphFont = GlyphFontRegistry.font("FontAwesome");
        logger.debug("Loading font \"FontAwesome\"...");
        glyphFont = new GlyphFont("FontAwesome", 12, "ninja/mbedded/ninjaterm/resources/fontawesome-webfont.ttf");

        // Create application model (data/state)
        Model model = new Model(new ComPortFactory());

        FXMLLoader loader = new FXMLLoader(getClass().getResource("ninja/mbedded/ninjaterm/view/mainWindow/MainWindowView.fxml"));
        try {
            Parent root = loader.load();
        } catch (IOException e) {
            throw new RuntimeException(e);
            //return;
        }
        MainWindowViewController mainWindowViewController = loader.getController();

        mainWindowViewController.init(model, glyphFont);

        //mainWindowViewController.addNewTerminal();


        // If the splashscreen was skipped, splashScreenStage will be null
        if (!disableSplashScreen)
            splashScreenStage.close();

        mainStage = new Stage();
        mainStage.setTitle("NinjaTerm");

        Scene scene = new Scene(mainWindowViewController.mainVBox, 1000, 800);
        mainStage.setScene(scene);

        mainStage.initStyle(StageStyle.DECORATED);
        //mainStage.centerOnScreen();
        mainStage.show();

        // Make sure the main stage has focus (is in front of all other windows)
        mainStage.toFront();

        // Call event handler in model for app closing
        mainStage.setOnCloseRequest(event -> {
            model.handleAppClosing();
        });

        model.createTerminal();
    }

    private void showError(Thread t, Throwable e) {
        System.err.println("***Default exception handler***");

        // Stop all threads except this one
        // @todo Improve the way that the other threads are stopped, the current way is dangerous and unpredictable
        for (Thread thread : Thread.getAllStackTraces().keySet())
        {  if (thread != Thread.currentThread() && thread.getState() == Thread.State.RUNNABLE)
            thread.stop();
        }

        if (Platform.isFxApplicationThread()) {
            // Write the exception to the logger, and also show pop-up
            logger.error(StringUtils.throwableToString(e));
            ExceptionPopup.showAndWait(e);
        } else {
            System.err.println("An unexpected error occurred in " + t);

        }
    }


    /**
     * Entry point for application. This calls <code>launch(args)</code> which starts the JavaFX UI.
     *
     * @param args
     */
    public static void main(String[] args) {

        launch(args);
    }
}
