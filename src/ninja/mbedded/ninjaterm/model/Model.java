package ninja.mbedded.ninjaterm.model;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import ninja.mbedded.ninjaterm.model.globalStats.GlobalStats;
import ninja.mbedded.ninjaterm.model.status.Status;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import org.slf4j.Logger;

import java.util.ArrayList;
import java.util.List;

/**
 * Model for the NinjaTerm application.
 *
 * This contains all of the app data and state. This drives
 * the view through event handlers (the model itself does not contain
 * any references to the view).
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-09-16
 * @last-modified 2016-10-12
 */
public class Model {

    public ObservableList<Terminal> terminals = FXCollections.observableArrayList();
    public Status status = new Status(this);
    public GlobalStats globalStats = new GlobalStats();

    public List<CloseTerminalListener> closedTerminalListeners = new ArrayList<>();

    private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

    public Model() {
         //status = new Status(this);
    }

    /**
     * Call this to close a terminal.
     *
     * This should be called from the UI when the user clicks the "X" button in the tab header,
     * or when the user clicks close the tab's right-click context menu.
     *
     * @param terminalToClose
     */
    public void closeTerminal(Terminal terminalToClose) {

        // We want to close the COM port connected to this terminal,
        // if it is open
        if(terminalToClose.isComPortOpen.get())
            terminalToClose.closeComPort();

        // Emit an event for the UI
        for(CloseTerminalListener closeTerminalListener : closedTerminalListeners) {
            closeTerminalListener.run(terminalToClose);
        }

        // The UI should of now removed the terminal Tab and the associated controller
        // Remove the terminal model from the list
        terminals.remove(terminalToClose);
    }

    /**
     * This needs to be called when the application is closing. This method
     * makes sure all the COM ports attached to terminal tabs are closed.
     */
    public void handleAppClosing() {
        // We need to close all COM ports
        for(Terminal terminal : terminals) {
            // We want to close the COM port connected to this terminal,
            // if it is open
            if(terminal.isComPortOpen.get())
                terminal.closeComPort();
        }
    }

    /**
     * This is designed to be called by the Open/Close COM port button when it is
     * clicked.
     */
    public void openOrCloseCurrentComPort() {
        logger.debug("openOrCloseCurrentComPort() called.");

    }

}
