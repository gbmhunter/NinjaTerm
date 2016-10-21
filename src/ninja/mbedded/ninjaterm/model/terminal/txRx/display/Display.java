package ninja.mbedded.ninjaterm.model.terminal.txRx.display;

import javafx.beans.property.SimpleBooleanProperty;
import javafx.beans.property.SimpleDoubleProperty;
import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.property.SimpleObjectProperty;
import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import org.slf4j.Logger;

/**
 * Model containing data and logic for the display components of the TX/RX data.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-16
 * @last-modified   2016-10-21
 */
public class Display {

    public enum LayoutOptions {
        SINGLE_PANE("Single Pane"),
        SEPARATE_TX_RX("Separate TX/RX"),
        ;

        private String label;

        LayoutOptions(String label) {
            this.label = label;
        }

        @Override
        public String toString() {
            return label;
        }
    }

    public enum TxCharSendingOptions {
        SEND_TX_CHARS_IMMEDIATELY,
        SEND_TX_CHARS_ON_ENTER
    }

    //================================================================================================//
    //============================================ CONSTANTS =========================================//
    //================================================================================================//

    /**
     * The default buffer size (in chars/bytes) for both TX and RX data.
     * Setting this too large may cause performance issues.
     * When set to 50,000, on a Surface Pro 4 with i5, 8G RAM, the rendering of 50,000 characters
     * 10 times a second (basic "Hello, world!" RX data) would cause the processor usage to jump up by 30%.
     * No RX data filter was active at this time.
     */
    public final int DEFAULT_BUFFER_SIZE_CHARS = 20000;

    //================================================================================================//
    //============================================= FIELDS ===========================================//
    //================================================================================================//

    public SimpleBooleanProperty localTxEcho = new SimpleBooleanProperty(false);
    public SimpleBooleanProperty backspaceRemovesLastTypedChar = new SimpleBooleanProperty(true);

    /**
     * The selected layout option for the TX and RX data. This is changed by the user.
     */
    public SimpleObjectProperty<LayoutOptions> selLayoutOption = new SimpleObjectProperty<>(LayoutOptions.SEPARATE_TX_RX);

    public SimpleObjectProperty<TxCharSendingOptions> selTxCharSendingOption = new SimpleObjectProperty<>(TxCharSendingOptions.SEND_TX_CHARS_IMMEDIATELY);
    public SimpleIntegerProperty bufferSizeChars = new SimpleIntegerProperty(DEFAULT_BUFFER_SIZE_CHARS);

    public SimpleBooleanProperty wrappingEnabled = new SimpleBooleanProperty(false);
    public SimpleDoubleProperty wrappingWidth = new SimpleDoubleProperty(800.0);

    private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

    //================================================================================================//
    //============================================= METHODS ==========================================//
    //================================================================================================//

    public Display() {

        wrappingWidth.addListener((observable, oldValue, newValue) -> {
            logger.debug("wrappingWidth set to \"" + Double.toString(newValue.doubleValue()) + "\".");
        });

    }

}
