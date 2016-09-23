package ninja.mbedded.ninjaterm.model.terminal;

import javafx.beans.property.SimpleStringProperty;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.logging.Logging;
import ninja.mbedded.ninjaterm.model.terminal.stats.Stats;
import ninja.mbedded.ninjaterm.model.terminal.txRx.TxRx;
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
     * The terminal name. This is displayed in the terminal tab header. It is renameable by
     * the user.
     */
    public SimpleStringProperty terminalName = new SimpleStringProperty("");

    public TxRx txRx;
    public Logging logging;
    public Stats stats;

    public Terminal(Model model) {
        txRx = new TxRx();
        logging = new Logging(model, this);
        stats = new Stats();
    }

}
