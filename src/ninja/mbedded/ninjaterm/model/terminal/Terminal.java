package ninja.mbedded.ninjaterm.model.terminal;

import javafx.beans.property.SimpleStringProperty;
import ninja.mbedded.ninjaterm.model.terminal.logging.Logging;
import ninja.mbedded.ninjaterm.model.terminal.stats.Stats;
import ninja.mbedded.ninjaterm.model.terminal.txRx.TxRx;
import sun.rmi.runtime.Log;

/**
 * Created by gbmhu on 2016-09-16.
 */
public class Terminal {

    /**
     * The terminal name. This is displayed in the terminal tab header. It is renameable by
     * the user.
     */
    public SimpleStringProperty terminalName = new SimpleStringProperty("");

    public TxRx txRx = new TxRx();
    public Logging logging = new Logging();
    public Stats stats = new Stats();

}
