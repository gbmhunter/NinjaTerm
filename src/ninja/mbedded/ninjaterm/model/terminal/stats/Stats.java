package ninja.mbedded.ninjaterm.model.terminal.stats;

import javafx.beans.property.SimpleIntegerProperty;

/**
 * Model containing data and logic for statistics about a terminal (COM port).
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-16
 * @last-modified   2016-09-23
 */
public class Stats {

    public SimpleIntegerProperty numCharactersTx = new SimpleIntegerProperty(0);
    public SimpleIntegerProperty numCharactersRx = new SimpleIntegerProperty(0);

}
