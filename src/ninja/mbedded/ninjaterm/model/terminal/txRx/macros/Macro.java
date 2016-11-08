package ninja.mbedded.ninjaterm.model.terminal.txRx.macros;

import javafx.beans.property.SimpleBooleanProperty;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;

/**
 * This object represents a single macro which is associated with a terminal.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-11-06
 * @last-modified   2016-11-08
 */
public class Macro {

    public SimpleStringProperty name = new SimpleStringProperty();

    public SimpleObjectProperty<Encodings> encoding = new SimpleObjectProperty<>(Encodings.ASCII);
    public SimpleStringProperty sequence = new SimpleStringProperty();

    public SimpleBooleanProperty sendSequenceImmediately = new SimpleBooleanProperty(true);

    public Macro() {


    }

}
