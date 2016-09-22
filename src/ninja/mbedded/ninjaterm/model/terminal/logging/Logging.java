package ninja.mbedded.ninjaterm.model.terminal.logging;

import javafx.beans.property.ReadOnlyBooleanProperty;
import javafx.beans.property.ReadOnlyBooleanWrapper;
import javafx.beans.property.SimpleStringProperty;
import ninja.mbedded.ninjaterm.interfaces.DataReceivedAsStringListener;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.model.terminal.txRx.TxRx;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * Created by gbmhu on 2016-09-22.
 */
public class Logging {

    public SimpleStringProperty logFilePath = new SimpleStringProperty("");
    public ReadOnlyBooleanWrapper isLogging = new ReadOnlyBooleanWrapper();

    private Model model;
    private Terminal terminal;

    private DataReceivedAsStringListener dataReceivedAsStringListener;

    private FileWriter fileWriter;
    private BufferedWriter bufferedWriter;

    public Logging(Model model, Terminal terminal) {

        this.model = model;
        this.terminal = terminal;

        // Set the default log file path
        logFilePath.set(buildDefaultLogFilePath());

        dataReceivedAsStringListener = data -> {
            saveNewDataToLogFile(data);
        };

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

    public void enableLogging() {

        // Open file whose file path is specified in the model
        try {
            fileWriter = new FileWriter(logFilePath.get(), true); //true tells to append data.
            bufferedWriter = new BufferedWriter(fileWriter);
        } catch (IOException e) {
            model.status.addErr("Could not open log file for writing. Reported error: " + e.getMessage());

            // Do not continue with rest of method (isLogging will remain false)
            return;
        }

        // Add listener. This will cause saveNewDataToLogFile() to be called when there is new
        // RX data
        terminal.txRx.dataReceivedAsStringListeners.add(dataReceivedAsStringListener);

        model.status.addMsg("Logging enabled to \"" + logFilePath.get() + "\".");

        isLogging.set(true);
    }

    private void saveNewDataToLogFile(String data) {

        //System.out.println("Logging to file. data = " + data);
        try {
            bufferedWriter.write(data);

            // This forces the data to be written to the file. If serious processor/disk loading
            // occurs, it may be wiser to put this on a timer, e.g. once per second.
            bufferedWriter.flush();
        } catch (IOException e) {
            model.status.addErr("Could not write to log file. Reported error: " + e.getMessage());

            // Something has gone wrong, disable logging
            disableLogging();
        }
    }

    public void disableLogging() {
        isLogging.set(false);

        // Remove the listener. This will stop calls to saveNewDataToLogFile()
        terminal.txRx.dataReceivedAsStringListeners.remove(dataReceivedAsStringListener);

        // Now close the file
        try {
            bufferedWriter.close();
        } catch (IOException e) {
            model.status.addErr("Could not close log file. Reported error: " + e.getMessage());
            // Not that isLogging will still transistion to false. Do we want this?
            return;
        }

        model.status.addMsg("Log file \"" + logFilePath.get() + "\" closed.");
    }

}
