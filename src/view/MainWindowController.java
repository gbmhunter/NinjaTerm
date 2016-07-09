package view;

import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.Button;

import java.net.URL;
import java.util.ResourceBundle;

public class MainWindowController implements Initializable {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    public Button openCloseComPortButton;

    @Override
    public void initialize(URL location, ResourceBundle resources) {

        openCloseComPortButton.setOnAction((ActionEvent) -> {
            openCloseComPortButtonPressed();
        });

    }

    private void openCloseComPortButtonPressed() {

        System.out.println("Button pressed handler called.");

        if(openCloseComPortButton.getText().equals("Open")) {
            openCloseComPortButton.setText("Close");
        } else {
            openCloseComPortButton.setText("Open");
        }


    }





}
