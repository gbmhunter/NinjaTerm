package ninja.mbedded.ninjaterm.model.terminal.logging;

import javafx.beans.property.SimpleStringProperty;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * Created by gbmhu on 2016-09-22.
 */
public class Logging {

    public SimpleStringProperty logFilePath = new SimpleStringProperty("");

    public Logging() {

        // Set the default log file path
        logFilePath.set(buildDefaultLogFilePath());

    }

    private String buildDefaultLogFilePath() {
        String userHomeDir = System.getProperty("user.home");

        // Build up a string of the current date/time (incl. milli-seconds)
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd-HH-mm-ss");
        Date date = new Date();
        String dateString = sdf.format(date);

        String defaultLogFilePath = userHomeDir + File.separator + "NinjaTerm-" + dateString + ".log";

        return defaultLogFilePath;
    }

}
