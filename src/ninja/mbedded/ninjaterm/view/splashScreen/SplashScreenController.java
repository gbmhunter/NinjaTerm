package ninja.mbedded.ninjaterm.view.splashScreen;

import javafx.application.Preloader;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;

import java.io.IOException;

/**
 * Created by gbmhu on 2016-09-20.
 */
public class SplashScreenController extends VBox {

    

   public SplashScreenController() {
       FXMLLoader fxmlLoader = new FXMLLoader(getClass().getResource(
               "SplashScreenView.fxml"));

       fxmlLoader.setRoot(this);
       fxmlLoader.setController(this);

       try {
           fxmlLoader.load();
       } catch (IOException exception) {
           throw new RuntimeException(exception);
       }
   }

}
