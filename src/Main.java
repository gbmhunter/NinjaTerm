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
import ninja.mbedded.ninjaterm.view.splashScreen.SplashScreenController;
import org.controlsfx.glyphfont.GlyphFont;
import org.controlsfx.glyphfont.GlyphFontRegistry;

import java.io.IOException;

public class Main extends Application {

    private GlyphFont glyphFont;

    private final boolean disableSplashScreen = false;

    private Stage splashScreenStage;
    private Stage mainStage;

    @Override
    public void start(Stage primaryStage) throws Exception{

        if(disableSplashScreen) {
            loadMainWindow();
            return;
        }

        this.splashScreenStage = primaryStage;

        //Parent root = FXMLLoader.load(getClass().getResource("ninja.mbedded.ninjaterm.view/MainWindowViewController.fxml"));

        // Create splashscreen
        /*VBox root = new VBox();
        Button btn = new Button("Say 'Hello World'");
        root.getChildren().add(btn);

        // Java 8: requires setting the layout pane background style to transparent
        // https://javafx-jira.kenai.com/browse/RT-38938
        // "Modena uses a non-transparent background by default"
        root.setStyle("-fx-background-color: transparent;");*/

        SplashScreenController splashScreenController = new SplashScreenController();

        Scene splashScreenScene = new Scene(splashScreenController, 800, 600, Color.TRANSPARENT);
        splashScreenController.isFinished.addListener((observable, oldValue, newValue) -> {
            if(newValue) {
                loadMainWindow();
            }
        });

        primaryStage.initStyle(StageStyle.TRANSPARENT);
        primaryStage.setScene(splashScreenScene);
        primaryStage.show();

        splashScreenController.startNameVersionInfoMsg();
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

        MainWindowViewController mainWindowViewController =
                loader.getController();
        //MainWindowViewController mainWindowViewController = new MainWindowViewController();
        mainWindowViewController.init(model, glyphFont, new ComPortManager());

        mainWindowViewController.addNewTerminal();

        // If the splashscreen was skipped, splashScreenStage will be null
        if(!disableSplashScreen)
            splashScreenStage.close();

        mainStage = new Stage();
        mainStage.setTitle("NinjaTerm");

        Scene scene = new Scene(mainWindowViewController.mainVBox, 1000, 800);
        mainStage.setScene(scene);

        /*scene.setOnKeyPressed(new EventHandler<KeyEvent>() {
            public void handle(KeyEvent ke) {
                System.out.println("Key pressed.");
            }
        });*/

        //mainWindowViewController.terminalViewControllers.get(0).rxTxController.showPopover();

        mainStage.initStyle(StageStyle.DECORATED);
        //mainStage.centerOnScreen();
        mainStage.show();

        // Make sure the main stage has focus (is in front of all other windows)
        mainStage.toFront();
    }


    public static void main(String[] args) {
        launch(args);
        //LauncherImpl.launchApplication(Main.class, SplashScreenController.class, args);
    }
}
