package ninja.mbedded.ninjaterm.model.globalStats;

import javafx.beans.property.SimpleIntegerProperty;

/**
 * Created by gbmhu on 2016-09-16.
 */
public class GlobalStats {

    public SimpleIntegerProperty numCharactersTx = new SimpleIntegerProperty(0);
    public SimpleIntegerProperty numCharactersRx = new SimpleIntegerProperty(0);

}
