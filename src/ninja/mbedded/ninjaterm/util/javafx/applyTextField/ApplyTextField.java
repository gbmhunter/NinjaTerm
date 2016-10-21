package ninja.mbedded.ninjaterm.util.javafx.applyTextField;

import javafx.beans.property.SimpleStringProperty;
import javafx.scene.control.TextField;
import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import org.slf4j.Logger;

/**
 * An enhanced TextField which has an added <code>onApply</code> property.
 *
 * This property gets set with the TextField text only when either ENTER is pressed,
 * or the TextField loses focus.
 *
 * This is a useful property to have when the user is changing something in where the text input
 * would cause errors/mishaps while half-way though the change (this is kinda of like a "better"
 * alternative to an "Apply" button).
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-10-21
 * @last-modified   2016-10-21
 */
public class ApplyTextField extends TextField {

    /**
     * This property gets set with the TextField text only when either ENTER is pressed,
     * or the TextField loses focus.
     */
    public SimpleStringProperty onApply = new SimpleStringProperty();

    private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

    public ApplyTextField() {

        // Only send the new line pattern information to the model when either the
        // enter key is pressed, or the text field loses focus.
        onKeyTypedProperty().set(event -> {
            logger.debug("onKeyTypeProperty().addListener() called.");

            if(event.getCharacter().equals("\r")) {
                logger.debug("Enter was pressed.");

                onApply.set(textProperty().get());
            }
        });

        focusedProperty().addListener((observable, oldValue, newValue) -> {
            if(!newValue) {
                onApply.set(textProperty().get());
            }
        });

    }

}
