package ninja.mbedded.ninjaterm.model.terminal.txRx.macros;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.model.terminal.txRx.TxRx;
import ninja.mbedded.ninjaterm.util.encodingUtils.EncodingUtils;
import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import org.apache.commons.lang3.StringEscapeUtils;
import org.slf4j.Logger;

import java.util.ArrayList;
import java.util.List;

/**
 * Manages the macros assigned to each terminal.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-11-06
 * @last-modified   2016-11-08
 */
public class MacroManager {

    private final int DEFAULT_NUM_OF_MACROS = 3;

    private Model model;
    private Terminal terminal;

    public ObservableList<Macro> macros = FXCollections.observableArrayList();

    private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

    public MacroManager(Model model, Terminal terminal) {

        this.model = model;
        this.terminal = terminal;

        // Add default macros (they will all be blank)
        for(int i = 0; i < DEFAULT_NUM_OF_MACROS; i++) {
            Macro macro = new Macro();
            macro.name.set("M" + Integer.toString(i));
            macros.add(macro);
        }
    }

    /**
     * Sends the macro sequence to the COM port (TX).
     * @param macro     The macro to send.
     */
    public void runMacro(Macro macro) {
        logger.debug("runMacro() called with macro = " + macro);

        switch(macro.encoding.get()) {

            case ASCII:
                parseAscii(macro);
                break;
            case HEX:
                parseHex(macro);
                break;
            default:
                throw new RuntimeException("Encoding enum not recognised.");
        }


    }

    private void parseAscii(Macro macro) {
        // "Un-escape" any escape sequences found in the sequence
        // We use the Apachi StringEscapeUtils class to do this
        String parsedString = StringEscapeUtils.unescapeJava(macro.sequence.get());

        // Send the un-escaped string to the COM port
        terminal.txRx.addTxCharsToSend(parsedString.getBytes());

        if(macro.sendSequenceImmediately.get())
            terminal.txRx.sendBufferedTxDataToSerialPort();
    }

    private void parseHex(Macro macro) {

        List<Byte> byteList = new ArrayList<>();
        EncodingUtils.ReturnResult returnResult = new EncodingUtils.ReturnResult();
        EncodingUtils.hexStringToByteArray(macro.sequence.get(), byteList, returnResult);

        switch(returnResult.id) {
            case OK:
                break;
            case STRING_DID_NOT_HAVE_EVEN_NUMBER_OF_CHARS:
                model.status.addErr("Macro hex string \"" + macro.sequence.get() + "\" does not have an even number of characters.");
                return;
            case INVALID_CHAR:
                model.status.addErr("Macro hex string \"" + macro.sequence.get() + "\" contains invalid chars (must only contain numbers or the letters A-F).");
                return;
            default:
                throw new RuntimeException("ReturnCode was not recognised.");
        }

        byte[] byteArray = new byte[byteList.size()];
        for(int i = 0; i < byteList.size(); i++) {
            byteArray[i] = byteList.get(i);
        }

        // Send the un-escaped string to the COM port
        terminal.txRx.addTxCharsToSend(byteArray);

        if(macro.sendSequenceImmediately.get())
            terminal.txRx.sendBufferedTxDataToSerialPort();


    }

}
