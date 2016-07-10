import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.stage.Stage;
import ninja.mbedded.ninjaterm.controllers.MainWindowController;

public class Main extends Application {

    @Override
    public void start(Stage primaryStage) throws Exception{
        //Parent root = FXMLLoader.load(getClass().getResource("ninja.mbedded.ninjaterm.view/MainWindowController.fxml"));



        FXMLLoader loader = new FXMLLoader(
                getClass().getResource(
                        "ninja/mbedded/ninjaterm/view/MainWindow.fxml"
                )
        );

        Parent root = loader.load();

        MainWindowController mainWindowController =
                loader.getController();

        primaryStage.setTitle("NinjaTerm");
        primaryStage.setScene(new Scene(root, 300, 275));
        primaryStage.show();


    }


    public static void main(String[] args) {
        launch(args);
    }
}
