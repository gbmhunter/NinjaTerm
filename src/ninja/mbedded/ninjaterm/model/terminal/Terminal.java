package ninja.mbedded.ninjaterm.model.terminal;

import javafx.beans.property.SimpleBooleanProperty;
import javafx.beans.property.SimpleStringProperty;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.logging.Logging;
import ninja.mbedded.ninjaterm.model.terminal.stats.Stats;
import ninja.mbedded.ninjaterm.model.terminal.txRx.TxRx;
import ninja.mbedded.ninjaterm.util.comport.ComPort;
import sun.rmi.runtime.Log;

/**
 * Model for a single "terminal" instance (which is displayed on a tab in the GUI).
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-16
 * @last-modified   2016-09-23
 */
public class Terminal {

    /**
     * The terminal name. This is displayed in the terminal tab header. It is re-nameable by
     * the user. Default name is COM?, which the model will update to COM1 (or COM2, ... e.t.c)
     * when an actual COM port is opened.
     */
    public SimpleStringProperty terminalName = new SimpleStringProperty("COM?");

    /**
     * This is set to true once the user renames the terminal for the first time. This will stop
     * the terminal tab from being auto-renamed to COM1 (or COM2, ... e.t.c) when a COM port
     * is opened.
     */
    public SimpleBooleanProperty userHasRenamedTerminal = new SimpleBooleanProperty(false);

    public TxRx txRx;
    public Logging logging;
    public Stats stats;

    /**
     * The COM port instance attached to this terminal.
     */
    public ComPort comPort = new ComPort();

    public Terminal(Model model) {
        txRx = new TxRx(model, this);
        logging = new Logging(model, this);
        stats = new Stats();
    }

    /**
     * This is work in progress! All the non-UI code for opening the COM port should be
     * moved from <code>{@link ninja.mbedded.ninjaterm.view.mainWindow.terminal.TerminalViewController}</code>
     * to here.
     */
    public void openComPort() {

        if(!userHasRenamedTerminal.get()) {
            // Rename the terminal tab to "COM1" e.t.c...

            terminalName.set(comPort.getName());
        }
    }

    public void manuallyRenameTerminalTab(String newName) {
        terminalName.set(newName);
        userHasRenamedTerminal.set(true);
    }

}
