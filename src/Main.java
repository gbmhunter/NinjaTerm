import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.stage.Stage;
import ninja.mbedded.ninjaterm.view.MainWindow.MainWindowController;
import ninja.mbedded.ninjaterm.managers.ComPortManager;

public class Main extends Application {

    @Override
    public void start(Stage primaryStage) throws Exception{
        //Parent root = FXMLLoader.load(getClass().getResource("ninja.mbedded.ninjaterm.view/MainWindowController.fxml"));

        FXMLLoader loader = new FXMLLoader(
            getClass().getResource(
                    "ninja/mbedded/ninjaterm/view/MainWindow/MainWindow.fxml"
            )
        );

        Parent root = loader.load();

        MainWindowController mainWindowController =
                loader.getController();

        // Inject dependencies
        mainWindowController.setComPortManager(new ComPortManager());
        mainWindowController.addNewTerminal();

        primaryStage.setTitle("NinjaTerm");
        primaryStage.setScene(new Scene(root, 1000, 800));
        primaryStage.show();


    }


    public static void main(String[] args) {
        launch(args);
    }
}
