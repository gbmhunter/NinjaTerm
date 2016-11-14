package ninja.mbedded.ninjaterm.model.terminal.txRx.macros;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.util.encodingUtils.EncodingUtils;
import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import org.apache.commons.lang3.StringEscapeUtils;
import org.javatuples.Pair;
import org.slf4j.Logger;

import java.util.List;

/**
 * Manages the macros assigned to each terminal.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-11-06
 * @last-modified   2016-11-14
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

            // Give macro a default name (M1, M2, ...)
            macro.name.set("M" + Integer.toString(macros.size()));
            macros.add(macro);
        }
    }

    /**
     * Sends the macro sequence to the COM port (TX).
     * @param macro     The macro to send.
     */
    public void runMacro(Macro macro) {
        logger.debug("runMacro() called with macro = " + macro);

        if(macro.sequence.get().equals("")) {
            model.status.addErr("Macro sequence is empty, cannot run.");
            return;
        }

        switch(macro.encoding.get()) {

            case ASCII:
                runAscii(macro);
                break;
            case HEX:
                runHex(macro);
                break;
            default:
                throw new RuntimeException("Encoding enum not recognised.");
        }

    }

    public void deleteMacro(Macro macro) {
        macros.remove(macro);
    }

    private void runAscii(Macro macro) {
        // "Un-escape" any escape sequences found in the sequence
        // We use the Apachi StringEscapeUtils class to do this
        String parsedString = StringEscapeUtils.unescapeJava(macro.sequence.get());

        // Send the un-escaped string to the COM port
        terminal.txRx.addTxCharsToSend(parsedString.getBytes());

        if(macro.sendSequenceImmediately.get())
            terminal.txRx.sendBufferedTxDataToSerialPort();
    }

    /**
     * Runs a macro, treating the sequence as a hex sequence.
     * @param macro
     */
    private void runHex(Macro macro) {

        Pair<List<Byte>, EncodingUtils.ReturnId> result = EncodingUtils.hexStringToByteArray(macro.sequence.get());
        List<Byte> bytes = result.getValue0();
        EncodingUtils.ReturnId returnId = result.getValue1();

        switch(returnId) {
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

        byte[] byteArray = new byte[bytes.size()];
        for(int i = 0; i < bytes.size(); i++) {
            byteArray[i] = bytes.get(i);
        }

        // Send the un-escaped string to the COM port
        terminal.txRx.addTxCharsToSend(byteArray);

        if(macro.sendSequenceImmediately.get())
            terminal.txRx.sendBufferedTxDataToSerialPort();

    }

}
