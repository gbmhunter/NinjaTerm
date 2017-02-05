package ninja.mbedded.ninjaterm.model.terminal.comPortSettings;

import javafx.beans.property.SimpleObjectProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.util.comPort.*;

/**
 * Model containing data and logic relating to the COM settings for a terminal.
 *
 * Relates to the COM Settings tab in the view.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-10-05
 * @last-modified   2016-10-28
 */
public class ComPortSettings {

    public SimpleObjectProperty<String> selComPortName = new SimpleObjectProperty<>("");
    public SimpleObjectProperty<BaudRates> selBaudRate = new SimpleObjectProperty<>(BaudRates.BAUD_9600);
    public SimpleObjectProperty<NumDataBits> selNumDataBits = new SimpleObjectProperty<>(NumDataBits.EIGHT);
    public SimpleObjectProperty<Parities> selParity = new SimpleObjectProperty<>(Parities.NONE);
    public SimpleObjectProperty<NumStopBits> selNumStopBits = new SimpleObjectProperty<>(NumStopBits.ONE);

    public ObservableList<String> scannedComPorts = FXCollections.observableArrayList();


    // PARENT MODEL
    private Model model;

    private ComPort comPort;

    public ComPortSettings(Model model, Terminal terminal, ComPort comPort) {
        this.model = model;
        this.comPort = comPort;
    }

    public void scanComPorts() {
        String[] portNames = comPort.scan();

        if (portNames.length == 0) {
            model.status.addMsg("No COM ports found on this computer.");
            return;
        }

        model.status.addMsg("Searched for COM ports. " + portNames.length + " COM port(s) found.");

        // Update the variable which holds all the scanned and found
        // COM ports (the UI should be listening to changes on this variable)
        scannedComPorts.setAll(portNames);
    }

}
