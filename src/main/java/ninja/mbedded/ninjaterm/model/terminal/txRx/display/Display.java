package ninja.mbedded.ninjaterm.model.terminal.txRx.display;

import javafx.beans.property.SimpleBooleanProperty;
import javafx.beans.property.SimpleDoubleProperty;
import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.property.SimpleObjectProperty;
import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import org.slf4j.Logger;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Model containing data and logic for the display components of the TX/RX data.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @last-modified 2016-11-22
 * @since 2016-09-16
 */
public class Display {

    //================================================================================================//
    //========================================= CLASS ENUMS ==========================================//
    //================================================================================================//

    /**
     * The different layout options for the TX and RX panes.
     */
    public enum LayoutOptions {
        SINGLE_PANE("Single Pane"),
        SEPARATE_TX_RX("Separate TX/RX"),;

        private String label;

        LayoutOptions(String label) {
            this.label = label;
        }

        @Override
        public String toString() {
            return label;
        }
    }

    public List<Double> textSizes = Arrays.asList(8.0, 9.0, 10.0);

    //================================================================================================//
    //========================================= CLASS CONSTANTS ======================================//
    //================================================================================================//

    /**
     * The default buffer size (in chars/bytes) for both TX and RX data.
     * Setting this too large may cause performance issues.
     * When set to 50,000, on a Surface Pro 4 with i5, 8G RAM, the rendering of 50,000 characters
     * 10 times a second (basic "Hello, world!" RX data) would cause the processor usage to jump up by 30%.
     * No RX data filter was active at this time.
     *
     * When using a WebView-based UI to display the data, {@code DEFAULT_BUFFER_SIZE_CHARS = 20000} caused
     * a small but noticeable amount of lag when the visible buffer size hit max. capacity, and chars had to
     * be deleted each time new data was inserted. {@code DEFAULT_BUFFER_SIZE_CHARS = 10000} seems to be o.k.
     */
    public final int DEFAULT_BUFFER_SIZE_CHARS = 10000;

    /**
     * The default width at which text will wrap in the TX and RX data display panes.
     */
    public final double DEFAULT_WRAPPING_WIDTH_PX = 800;

    //================================================================================================//
    //========================================= CLASS FIELDS =========================================//
    //================================================================================================//

    public SimpleBooleanProperty localTxEcho = new SimpleBooleanProperty(false);
    public SimpleBooleanProperty backspaceRemovesLastTypedChar = new SimpleBooleanProperty(true);

    /**
     * The selected layout option for the TX and RX data. This is changed by the user.
     */
    public SimpleObjectProperty<LayoutOptions> selLayoutOption = new SimpleObjectProperty<>(LayoutOptions.SEPARATE_TX_RX);

    /**
     * The maximum TX and RX buffer size, for any "buffer". For RX data, this sets the max. size for all StreamedData objects,
     * as well as the maximum number of characters displayed in the RX panel.
     */
    public SimpleIntegerProperty bufferSizeChars = new SimpleIntegerProperty(DEFAULT_BUFFER_SIZE_CHARS);

    /**
     * If true wrapping is enabled, otherwise false.
     */
    public SimpleBooleanProperty wrappingEnabled = new SimpleBooleanProperty(true);

    /**
     * The wrapping width of text in the RX pane.
     */
    public SimpleDoubleProperty wrappingWidth = new SimpleDoubleProperty(DEFAULT_WRAPPING_WIDTH_PX);

    public SimpleDoubleProperty textSize = new SimpleDoubleProperty(10.0);

    private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

    //================================================================================================//
    //============================================= METHODS ==========================================//
    //================================================================================================//

    public Display() {

        wrappingWidth.addListener((observable, oldValue, newValue) -> {
            logger.debug("wrappingWidth set to \"" + Double.toString(newValue.doubleValue()) + "\".");
        });

        wrappingEnabled.addListener((observable, oldValue, newValue) -> {
            logger.debug("wrappingEnabled set to \"" + newValue.toString() + "\".");
        });

    }

}
