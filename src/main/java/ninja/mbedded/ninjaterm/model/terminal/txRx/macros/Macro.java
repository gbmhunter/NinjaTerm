package ninja.mbedded.ninjaterm.model.terminal.txRx.macros;

import javafx.beans.property.SimpleBooleanProperty;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;
import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import org.slf4j.Logger;

/**
 * This object represents a single macro which is associated with a terminal.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-11-06
 * @last-modified   2016-11-08
 */
public class Macro {

    public SimpleStringProperty name = new SimpleStringProperty("");

    public SimpleObjectProperty<Encodings> encoding = new SimpleObjectProperty<>(Encodings.ASCII);
    public SimpleStringProperty sequence = new SimpleStringProperty("");

    public SimpleBooleanProperty sendSequenceImmediately = new SimpleBooleanProperty(true);

    private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

    public Macro() {

        encoding.addListener((observable, oldValue, newValue) -> {
            logger.debug("encoding value changed to " + newValue);
        });

    }

    /**
     * Copy constructor. Used by the "Macro Manager" window to copy all macros while editing them, before saving
     * them back to the macro list held in the model ONLY IF the user presses the ok button.
     * @param macro
     */
    public Macro(Macro macro) {
        super();

        name.set(macro.name.get());
        encoding.set(macro.encoding.get());
        sequence.set(macro.sequence.get());
        sendSequenceImmediately.set(macro.sendSequenceImmediately.get());
    }

    @Override
    public String toString() {
        StringBuilder output = new StringBuilder();
        output.append("{ ");
        output.append("name = " + name.get() + ", ");
        output.append("encoding = " + encoding.get() + ", ");
        output.append("sequence = " + sequence.get() + ", ");
        output.append("sendSequenceImmediately = " + sendSequenceImmediately.get() + " }");
        return output.toString();
    }
}
