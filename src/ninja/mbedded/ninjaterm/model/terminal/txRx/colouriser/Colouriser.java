package ninja.mbedded.ninjaterm.model.terminal.txRx.colouriser;

import javafx.beans.property.SimpleBooleanProperty;
import javafx.beans.property.SimpleStringProperty;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;

/**
 * Model containing data and logic for adding colour to the TX/RX data.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-26
 * @last-modified   2016-10-14
 */
public class Colouriser {

    /**
     * Set this to enable/disable the ANSI escape code parser. Read this to determine
     * the current state.
     */
    public SimpleBooleanProperty ansiEscapeCodesEnabled = new SimpleBooleanProperty(true);

    public void init(Model model, Terminal terminal) {

        ansiEscapeCodesEnabled.addListener((observable, oldValue, newValue) -> {
            if(newValue) {
                terminal.txRx.rxDataEngine.setAnsiECEnabled(true);
                model.status.addMsg("ANSI escape code parsing enabled.");
            } else {
                terminal.txRx.rxDataEngine.setAnsiECEnabled(false);
                model.status.addMsg("ANSI escape code parsing disabled.");
            }
        });

    }

}
