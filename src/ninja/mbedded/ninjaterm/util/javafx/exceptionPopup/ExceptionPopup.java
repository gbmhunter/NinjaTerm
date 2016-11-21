package ninja.mbedded.ninjaterm.util.javafx.exceptionPopup;

import javafx.scene.control.Alert;
import javafx.scene.control.Label;
import javafx.scene.control.TextArea;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.Priority;

import java.io.PrintWriter;
import java.io.StringWriter;

/**
 * Class to display exceptions to the user in a pop-up window.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-10-18
 * @last-modified 2016-11-14
 */
public class ExceptionPopup {

    /**
     * Display the contents of the provided exception to the user, in a pop-up window.
     *
     * JavaFX must be initialised before this method is called.
     *
     * This method does not return until the pop-up window is closed.
     *
     * @param ex
     */
    public static void showAndWait(Throwable ex) {

        Alert alert = new Alert(Alert.AlertType.ERROR);
        alert.setTitle("Exception Dialog");

        // Ask the user to create a new issue on the GitHub repo
        alert.setHeaderText("Hot dang, an unexpected exception occurred! If you want this looked at, please copy the textual information below and create a new issue on the GitHub repo at www.github.com/mbedded-ninja/NinjaTerm/issues (while also adding any other information that may help). I promise to do my best to resolve the problem!");
        alert.setContentText(ex.getMessage());

        // Fix the alert dialogue window size. Without this code,
        // the window can take up the entire width of the screen
        alert.setResizable(true);
        alert.getDialogPane().setPrefSize(600, 400);

        // Create expandable Exception.
        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        ex.printStackTrace(pw);
        String exceptionText = sw.toString();

        Label label = new Label("The exception stacktrace was:");

        TextArea textArea = new TextArea(exceptionText);
        textArea.setEditable(false);
        textArea.setWrapText(true);

        textArea.setMaxWidth(Double.MAX_VALUE);
        textArea.setMaxHeight(Double.MAX_VALUE);
        GridPane.setVgrow(textArea, Priority.ALWAYS);
        GridPane.setHgrow(textArea, Priority.ALWAYS);

        GridPane expContent = new GridPane();
        expContent.setMaxWidth(Double.MAX_VALUE);
        expContent.add(label, 0, 0);
        expContent.add(textArea, 0, 1);

        // Set expandable Exception into the dialog pane.
        alert.getDialogPane().setExpandableContent(expContent);

        alert.showAndWait();

    }

}
