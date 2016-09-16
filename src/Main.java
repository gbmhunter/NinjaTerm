import javafx.application.Application;
import javafx.event.EventHandler;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.input.KeyCode;
import javafx.scene.input.KeyEvent;
import javafx.stage.Stage;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.view.mainwindow.MainWindowController;
import ninja.mbedded.ninjaterm.managers.ComPortManager;
import org.controlsfx.glyphfont.GlyphFont;
import org.controlsfx.glyphfont.GlyphFontRegistry;

public class Main extends Application {

    private GlyphFont glyphFont;

    @Override
    public void start(Stage primaryStage) throws Exception{
        //Parent root = FXMLLoader.load(getClass().getResource("ninja.mbedded.ninjaterm.view/MainWindowController.fxml"));

        // Initialise fontAwesome glyths (these are downloaded from CDN)
        //! @todo Remove dependency on internet connection
        glyphFont = GlyphFontRegistry.font("FontAwesome");

        // Create application model (data/state)
        Model model = new Model();

        FXMLLoader loader = new FXMLLoader(
            getClass().getResource(
                    "ninja/mbedded/ninjaterm/view/mainwindow/MainWindow.fxml"
            )
        );

        Parent root = loader.load();

        MainWindowController mainWindowController =
                loader.getController();
        mainWindowController.init(model, glyphFont);

        // Inject dependencies
        mainWindowController.setComPortManager(new ComPortManager());
        mainWindowController.addNewTerminal();

        primaryStage.setTitle("NinjaTerm");

        Scene scene = new Scene(root, 1000, 800);
        primaryStage.setScene(scene);

        /*scene.setOnKeyPressed(new EventHandler<KeyEvent>() {
            public void handle(KeyEvent ke) {
                System.out.println("Key pressed.");
            }
        });*/

        //mainWindowController.terminalViews.get(0).rxTxView.showPopover();

        primaryStage.show();


    }


    public static void main(String[] args) {
        launch(args);
    }
}
