package controllers;

import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.Button;
import javafx.scene.control.ComboBox;

import java.net.URL;
import java.util.ResourceBundle;

public class MainWindowController implements Initializable {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    public Button openCloseComPortButton;

    @FXML
    public ComboBox foundComPorts;

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
