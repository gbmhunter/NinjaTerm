package ninja.mbedded.ninjaterm.model.terminal.txRx.macros;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import ninja.mbedded.ninjaterm.model.terminal.txRx.TxRx;
import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import org.slf4j.Logger;

/**
 * Manages the macros assigned to each terminal.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-11-06
 * @last-modified   2016-11-08
 */
public class MacroManager {

    private final int DEFAULT_NUM_OF_MACROS = 3;

    public ObservableList<Macro> macros = FXCollections.observableArrayList();

    private TxRx txRx;

    private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

    public MacroManager(TxRx txRx) {

        this.txRx = txRx;

        // Add default macros
        for(int i = 0; i < DEFAULT_NUM_OF_MACROS; i++) {
            macros.add(new Macro());
        }
    }

    public void sendMacro(Macro macro) {
        logger.debug("sendMacro() called with macro = " + macro);

        txRx.addTxCharsToSend(macro.sequence.get().getBytes());
        txRx.sendBufferedTxDataToSerialPort();
    }

}
