package ninja.mbedded.ninjaterm.model;

import javafx.beans.property.IntegerProperty;
import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.value.ObservableIntegerValue;

/**
 * Model for the NinjaTerm application.
 *
 * This contains all of the app data and state. This drives
 * the view.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-09-16
 * @last-modified 2016-09-16
 */
public class Model {

    public SimpleIntegerProperty numCharactersTx = new SimpleIntegerProperty(0);
    public SimpleIntegerProperty numCharactersRx = new SimpleIntegerProperty(0);

    public Model() {

    }

}
