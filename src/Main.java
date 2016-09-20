import javafx.animation.KeyFrame;
import javafx.animation.Timeline;
import javafx.application.Application;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.stage.Stage;
import javafx.stage.StageStyle;
import javafx.util.Duration;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.view.mainwindow.MainWindowController;
import ninja.mbedded.ninjaterm.managers.ComPortManager;
import ninja.mbedded.ninjaterm.view.splashScreen.SplashScreenController;
import org.controlsfx.glyphfont.GlyphFont;
import org.controlsfx.glyphfont.GlyphFontRegistry;

public class Main extends Application {

    private GlyphFont glyphFont;

    private Stage splashScreenStage;
    private Stage mainStage;

    @Override
    public void start(Stage primaryStage) throws Exception{

        this.splashScreenStage = primaryStage;

        //Parent root = FXMLLoader.load(getClass().getResource("ninja.mbedded.ninjaterm.view/MainWindowController.fxml"));

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

        //FXMLLoader loader = new FXMLLoader(getClass().getResource("view/mainwindow/MainWindow.fxml"));

        //Parent root = loader.load();

        /*MainWindowController mainWindowController =
                loader.getController();*/
        MainWindowController mainWindowController = new MainWindowController();
        mainWindowController.init(model, glyphFont, new ComPortManager());
        
        mainWindowController.addNewTerminal();

        splashScreenStage.close();
        mainStage = new Stage();
        mainStage.setTitle("NinjaTerm");

        Scene scene = new Scene(mainWindowController, 1000, 800);
        mainStage.setScene(scene);

        /*scene.setOnKeyPressed(new EventHandler<KeyEvent>() {
            public void handle(KeyEvent ke) {
                System.out.println("Key pressed.");
            }
        });*/

        //mainWindowController.terminalControllers.get(0).rxTxController.showPopover();

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
