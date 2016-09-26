package ninja.mbedded.ninjaterm.model.terminal.txRx.formatting;

import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;

/**
 * Model containing data and logic for the formatting of TX/RX data.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-26
 * @last-modified   2016-09-26
 */
public class Formatting {

    public enum EnterKeyBehaviour {
        CARRIAGE_RETURN,
        NEW_LINE,
        CARRIAGE_RETURN_AND_NEW_LINE,
    }

    public SimpleObjectProperty<EnterKeyBehaviour> selEnterKeyBehaviour = new SimpleObjectProperty<>(EnterKeyBehaviour.CARRIAGE_RETURN);

}
