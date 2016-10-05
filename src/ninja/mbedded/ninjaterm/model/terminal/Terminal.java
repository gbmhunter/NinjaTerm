package ninja.mbedded.ninjaterm.model.terminal;

import javafx.application.Platform;
import javafx.beans.property.SimpleBooleanProperty;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;
import ninja.mbedded.ninjaterm.interfaces.OnRxDataListener;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.comPortSettings.ComPortSettings;
import ninja.mbedded.ninjaterm.model.terminal.logging.Logging;
import ninja.mbedded.ninjaterm.model.terminal.stats.Stats;
import ninja.mbedded.ninjaterm.model.terminal.txRx.TxRx;
import ninja.mbedded.ninjaterm.util.Decoding.Decoder;
import ninja.mbedded.ninjaterm.util.comport.ComPort;
import ninja.mbedded.ninjaterm.util.comport.ComPortException;
import ninja.mbedded.ninjaterm.view.mainWindow.terminal.TerminalViewController;
import sun.rmi.runtime.Log;

/**
 * Model for a single "terminal" instance (which is displayed on a tab in the GUI).
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-16
 * @last-modified   2016-10-05
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

    public SimpleBooleanProperty isComPortOpen = new SimpleBooleanProperty(false);

    private Model model;

    public ComPortSettings comPortSettings;
    public TxRx txRx;
    public Logging logging;
    public Stats stats;

    /**
     * The COM port instance attached to this terminal.
     */
    public ComPort comPort = new ComPort();

    private OnRxDataListener onRxDataListener;

    public Decoder decoder = new Decoder();

    public Terminal(Model model) {

        this.model = model;

        comPortSettings = new ComPortSettings(model, this);
        txRx = new TxRx(model, this);
        logging = new Logging(model, this);
        stats = new Stats();

        onRxDataListener = rxData -> {
            handleOnRxData(rxData);
        };
    }

    /**
     * This is work in progress! All the non-UI code for opening the COM port should be
     * moved from <code>{@link ninja.mbedded.ninjaterm.view.mainWindow.terminal.TerminalViewController}</code>
     * to here.
     */
    public void openComPort() {


        comPort.setName(comPortSettings.selComPortName.get());

        try {
            comPort.open();
        } catch (ComPortException e) {
            if (e.type == ComPortException.ExceptionType.COM_PORT_BUSY) {
                model.status.addErr(comPort.getName() + " was busy and could not be opened.");
                //comPort = null;
                return;
            } else if (e.type == ComPortException.ExceptionType.COM_PORT_DOES_NOT_EXIST) {
                model.status.addErr(comPort.getName() + " no longer exists. Please rescan.");
                //comPort = null;
                return;
            } else {
                throw new RuntimeException(e);
            }
        }

        // Set COM port parameters as specified by user on GUI
        comPort.setParams(
                comPortSettings.selBaudRate.get(),
                comPortSettings.selNumDataBits.get(),
                comPortSettings.selParity.get(),
                comPortSettings.selNumStopBits.get()
        );

        // Add a listener to run when RX data is received from the COM port
        comPort.onRxDataListeners.add(onRxDataListener);

        model.status.addMsg(comPort.getName() + " opened." +
                " Buad rate = " + comPort.getBaudRate() + "," +
                " parity = " + comPort.getParity() + "," +
                " num. stop bits = " + comPort.getNumStopBits() + ".");

        // If the user hasn't yet
        if(!userHasRenamedTerminal.get()) {
            // Rename the terminal tab to "COM1" e.t.c...
            terminalName.set(comPort.getName());
        }

        isComPortOpen.set(true);
    }

    private void handleOnRxData(byte[] rxData) {
        //System.out.println("rawRxData = " + Arrays.toString(rawRxData));
        String rxText;
        rxText = decoder.parse(rxData);

        //System.out.println("rxText = " + rxText);

        Platform.runLater(() -> {

            // Add the received data to the model
            //txRxViewController.addTxRxText(rxText);
            txRx.addRxData(rxText);

            // Update stats in app model
            stats.numCharactersRx.set(stats.numCharactersRx.get() + rxText.length());
            model.globalStats.numCharactersRx.set(model.globalStats.numCharactersRx.get() + rxText.length());

        });
    }

    public void closeComPort() {

        // Remove the listener before actually closing the COM port
        comPort.onRxDataListeners.remove(onRxDataListener);

        try {
            comPort.close();
        } catch (ComPortException e) {
            if (e.type == ComPortException.ExceptionType.COM_PORT_DOES_NOT_EXIST) {
                model.status.addErr("Attempted to close non-existant COM port. Was USB cable unplugged?");
            } else {
                throw new RuntimeException(e);
            }
        }

        model.status.addMsg(comPort.getName() + " closed.");

        isComPortOpen.set(false);
    }

    public void manuallyRenameTerminalTab(String newName) {
        terminalName.set(newName);
        userHasRenamedTerminal.set(true);
    }

}
