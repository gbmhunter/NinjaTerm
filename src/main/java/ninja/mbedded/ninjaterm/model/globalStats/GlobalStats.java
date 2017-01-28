package ninja.mbedded.ninjaterm.model.globalStats;

import javafx.beans.property.SimpleIntegerProperty;

/**
 * Model containing data and logic global statistics (not related to just one terminal).
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-16
 * @last-modified   2016-09-25
 */
public class GlobalStats {

    /**
     * The total number of characters send to all of the COM port.
     */
    public SimpleIntegerProperty numCharactersTx = new SimpleIntegerProperty(0);

    /**
     * The total number of characters received form all of the COM ports.
     */
    public SimpleIntegerProperty numCharactersRx = new SimpleIntegerProperty(0);

}
