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
 * @last-modified   2016-10-07
 */
public class Colouriser {

    public SimpleBooleanProperty ansiEscapeCodesEnabled = new SimpleBooleanProperty(true);

    public void init(Model model, Terminal terminal) {

        ansiEscapeCodesEnabled.addListener((observable, oldValue, newValue) -> {
            if(newValue)
                model.status.addMsg("ANSI escape code parsing enabled.");
            else
                model.status.addMsg("ANSI escape code parsing disabled.");
        });

    }

}
