package ninja.mbedded.ninjaterm.model.terminal.stats;

import javafx.beans.property.SimpleIntegerProperty;

/**
 * Created by gbmhu on 2016-09-16.
 */
public class Stats {

    public SimpleIntegerProperty numCharactersTx = new SimpleIntegerProperty(0);
    public SimpleIntegerProperty numCharactersRx = new SimpleIntegerProperty(0);

}
