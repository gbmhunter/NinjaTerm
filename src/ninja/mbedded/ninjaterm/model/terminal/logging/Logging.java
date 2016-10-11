package ninja.mbedded.ninjaterm.model.terminal.logging;

import javafx.beans.property.ReadOnlyBooleanWrapper;
import javafx.beans.property.SimpleBooleanProperty;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;
import ninja.mbedded.ninjaterm.model.terminal.txRx.RawDataReceivedListener;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.model.terminal.txRx.StreamedTextListener;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * Model containing data and logic for the logging of TX/RX data from a COM port.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-22
 * @last-modified   2016-09-25
 */
public class Logging {

    //================================================================================================//
    //============================================== ENUMS ===========================================//
    //================================================================================================//

    /**
     * The different ways logging files can be handled when opened for logging.
     */
    public enum FileBehaviour {
        APPEND,
        OVERWRITE
    }

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    public SimpleStringProperty logFilePath = new SimpleStringProperty("");

    public SimpleBooleanProperty swallowAnsiEscapeCodes = new SimpleBooleanProperty(false);

    public ReadOnlyBooleanWrapper isLogging = new ReadOnlyBooleanWrapper();

    /**
     * Stores the way the file will be handled when opened for logging.
     */
    public SimpleObjectProperty<FileBehaviour> selFileBehaviour = new SimpleObjectProperty<>(FileBehaviour.APPEND);

    private Model model;
    private Terminal terminal;

    private RawDataReceivedListener rawDataReceivedListener;
    private StreamedTextListener ansiParserOutputListener;

    private FileWriter fileWriter;
    private BufferedWriter bufferedWriter;

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public Logging(Model model, Terminal terminal) {

        this.model = model;
        this.terminal = terminal;

        // Set the default log file path
        logFilePath.set(buildDefaultLogFilePath());

        rawDataReceivedListener = data -> {
            saveNewDataToLogFile(data);
        };

        ansiParserOutputListener = streamedText -> {
            String ansiParserOutputText = streamedText.getText();
            saveNewDataToLogFile(ansiParserOutputText);
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

        // Don't do anything if logging is already enabled
        if(isLogging.get())
            return;

        boolean isAppend;
        if(selFileBehaviour.get() == FileBehaviour.APPEND) {
            isAppend = true;
        } else if(selFileBehaviour.get() == FileBehaviour.OVERWRITE) {
            isAppend = false;
        } else {
            throw new RuntimeException("selFileBehaviour not recognised!");
        }

        // Open file whose file path is specified in the model
        try {
            // The second parameter determines whether we overwrite or append
            fileWriter = new FileWriter(logFilePath.get(), isAppend);
            bufferedWriter = new BufferedWriter(fileWriter);
        } catch (IOException e) {
            model.status.addErr("Could not open log file for writing. Reported error: " + e.getMessage());

            // Do not continue with rest of method (isLogging will remain false)
            return;
        }

        // Add listener. This will cause saveNewDataToLogFile() to be called when there is new
        // RX data
        if(swallowAnsiEscapeCodes.get()) {
            terminal.txRx.ansiParserOutputListeners.add(ansiParserOutputListener);
        } else {
            // Listen to the raw RX data coming from the COM port
            terminal.txRx.rawDataReceivedListeners.add(rawDataReceivedListener);
        }

        model.status.addMsg("Logging enabled to \"" + logFilePath.get() + "\".");

        isLogging.set(true);
    }

    /**
     * Appends the given data to the end of the log file.
     * @param data  The data to append to the log file.
     */
    private void saveNewDataToLogFile(String data) {

        //System.out.println("Logging to file. data = " + data);
        try {
            bufferedWriter.write(data);

            // This forces the data to be written to the file. If serious processor/disk loading
            // occurs, it may be wiser to put this on a timer, e.g. once per second.
            bufferedWriter.flush();
        } catch (IOException e) {
            model.status.addErr("Could not write to log file. Reported error: " + e.getMessage() + ". Disabling logging.");

            // Something has gone wrong, disable logging
            disableLogging();
        }
    }

    /**
     * Disables logging.
     */
    public void disableLogging() {

        // Don't do anything if logging is already disabled.
        if(!isLogging.get())
            return;

        isLogging.set(false);

        // Remove the listener. This will stop calls to saveNewDataToLogFile()
        if(swallowAnsiEscapeCodes.get()) {
            terminal.txRx.ansiParserOutputListeners.remove(ansiParserOutputListener);
        } else {
            terminal.txRx.rawDataReceivedListeners.remove(rawDataReceivedListener);
        }

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
