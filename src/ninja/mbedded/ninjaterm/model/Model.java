package ninja.mbedded.ninjaterm.model;

import ninja.mbedded.ninjaterm.model.globalStats.GlobalStats;
import ninja.mbedded.ninjaterm.model.status.Status;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;

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
 * @last-modified 2016-10-04
 */
public class Model {

    public List<Terminal> terminals = new ArrayList<>();
    public Status status = new Status();
    public GlobalStats globalStats = new GlobalStats();

    public List<CloseTerminalListener> closedTerminalListeners = new ArrayList<>();

    public Model() {

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

}
