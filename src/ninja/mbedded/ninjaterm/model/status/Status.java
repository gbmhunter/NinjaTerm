package ninja.mbedded.ninjaterm.model.status;

import javafx.beans.property.ListProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.scene.Node;
import javafx.scene.paint.Color;
import javafx.scene.text.Text;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;

/**
 * Created by gbmhu on 2016-09-18.
 */
public class Status {

    public ObservableList<Node> statusMsgs = FXCollections.observableList(new ArrayList<Node>());

    public Status() {

    }

    /**
     * Prints the given message to the status window. This prepends the current date/time to the massage
     * as well as adding a carriage return and new-line character to the end of the message.
     * @param msg   The message you want to print.
     */
    public void addMsg(String msg) {

        // Build up a string of the current date/time (incl. milli-seconds)
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS");
        Date date = new Date();
        String dateString = sdf.format(date);

        //statusTextFlow.getChildren().add(new Text(dateString + ": " + msg + "\r\n"));
        statusMsgs.add(new Text(dateString + ": " + msg + "\r\n"));
    }

    /**
     * Prints the given error message to the status window. This prepends the current date/time to the massage
     * as well as adding a carriage return and new-line character to the end of the message.
     * @param msg   The error message you want to print.
     */
    public void addErr(String msg) {

        // Build up a string of the current date/time (incl. milli-seconds)
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS");
        Date date = new Date();
        String dateString = sdf.format(date);

        Text text = new Text(dateString + ": ERROR. " + msg + "\r\n");
        text.setFill(Color.RED);
        //statusTextFlow.getChildren().add(text);
        statusMsgs.add(text);
    }

}
