import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.paint.Color;
import javafx.stage.Stage;
import javafx.stage.StageStyle;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.view.mainWindow.MainWindowViewController;
import ninja.mbedded.ninjaterm.managers.ComPortManager;
import ninja.mbedded.ninjaterm.view.splashScreen.SplashScreenViewController;
import org.controlsfx.glyphfont.GlyphFont;
import org.controlsfx.glyphfont.GlyphFontRegistry;

import java.io.IOException;

public class Main extends Application {

    private GlyphFont glyphFont;

    private final boolean disableSplashScreen = true;

    private Stage splashScreenStage;
    private Stage mainStage;

    @Override
    public void start(Stage primaryStage) throws Exception{

        if(disableSplashScreen) {
            // Skip this function, and go straight to loading the main window.
            loadMainWindow();
            return;
        }

        this.splashScreenStage = primaryStage;

        // Load splashscreen FXML file and get controller
        FXMLLoader loader = new FXMLLoader(getClass().getResource("ninja/mbedded/ninjaterm/view/splashScreen/SplashScreenView.fxml"));
        try {
            Parent root = loader.load();
        } catch(IOException e) {
            return;
        }

        SplashScreenViewController splashScreenViewController = loader.getController();
        splashScreenViewController.init();

        Scene splashScreenScene = new Scene(loader.getRoot(), 800, 600, Color.TRANSPARENT);
        splashScreenViewController.isFinished.addListener((observable, oldValue, newValue) -> {
            if(newValue) {
                loadMainWindow();
            }
        });

        primaryStage.initStyle(StageStyle.TRANSPARENT);
        primaryStage.setScene(splashScreenScene);
        primaryStage.show();

        splashScreenViewController.startNameVersionInfoMsg();
        // Create delay before showing main window
        /*Timeline timeline = new Timeline(new KeyFrame(
                Duration.millis(3000),
                ae -> loadMainWindow()));
        timeline.play();*/
    }

    public void loadMainWindow() {
        // Initialise fontAwesome glyths (these are downloaded from CDN)
        //! @todo Remove dependency on internet connection
        glyphFont = GlyphFontRegistry.font("FontAwesome");

        // Create application model (data/state)
        Model model = new Model();

        FXMLLoader loader = new FXMLLoader(getClass().getResource("ninja/mbedded/ninjaterm/view/mainWindow/MainWindowView.fxml"));
        try {
            Parent root = loader.load();
        } catch(IOException e) {
            return;
        }
        MainWindowViewController mainWindowViewController = loader.getController();

        mainWindowViewController.init(model, glyphFont, new ComPortManager());

        mainWindowViewController.addNewTerminal();

        // If the splashscreen was skipped, splashScreenStage will be null
        if(!disableSplashScreen)
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
    }


    public static void main(String[] args) {
        launch(args);
        //LauncherImpl.launchApplication(Main.class, SplashScreenViewController.class, args);
    }
}
