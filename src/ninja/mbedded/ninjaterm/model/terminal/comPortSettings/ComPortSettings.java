package ninja.mbedded.ninjaterm.model.terminal.comPortSettings;

import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.property.SimpleObjectProperty;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.util.comport.BaudRates;
import ninja.mbedded.ninjaterm.util.comport.NumDataBits;
import ninja.mbedded.ninjaterm.util.comport.NumStopBits;
import ninja.mbedded.ninjaterm.util.comport.Parities;

/**
 * Model containing data and logic relating to the COM settings for a terminal.
 *
 * Relates to the COM Settings tab in the view.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-10-05
 * @last-modified   2016-10-05
 */
public class ComPortSettings {

    public SimpleObjectProperty<String> selComPortName = new SimpleObjectProperty<>("");
    public SimpleObjectProperty<BaudRates> selBaudRate = new SimpleObjectProperty<>(BaudRates.BAUD_9600);
    public SimpleObjectProperty<NumDataBits> selNumDataBits = new SimpleObjectProperty<>(NumDataBits.EIGHT);
    public SimpleObjectProperty<Parities> selParity = new SimpleObjectProperty<>(Parities.NONE);
    public SimpleObjectProperty<NumStopBits> selNumStopBits = new SimpleObjectProperty<>(NumStopBits.ONE);

    public ComPortSettings(Model model, Terminal terminal) {

    }

}
