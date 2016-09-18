package ninja.mbedded.ninjaterm.model.terminal.txRx.display;

import javafx.beans.property.SimpleBooleanProperty;
import javafx.beans.property.SimpleDoubleProperty;
import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.property.SimpleObjectProperty;

/**
 * Created by gbmhu on 2016-09-16.
 */
public class Display {

    public enum LayoutOptions {
        COMBINED_TX_RX("Combined TX/RX"),
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

    public final int DEFAULT_BUFFER_SIZE_CHARS = 10000;

    public SimpleBooleanProperty localTxEcho = new SimpleBooleanProperty(false);
    public SimpleObjectProperty<LayoutOptions> selectedLayoutOption = new SimpleObjectProperty<>();
    public SimpleObjectProperty<TxCharSendingOptions> selTxCharSendingOption = new SimpleObjectProperty<>();
    public SimpleIntegerProperty bufferSizeChars = new SimpleIntegerProperty(DEFAULT_BUFFER_SIZE_CHARS);

    public SimpleBooleanProperty wrappingEnabled = new SimpleBooleanProperty(false);
    public SimpleDoubleProperty wrappingWidth = new SimpleDoubleProperty(800.0);

    public Display() {
        selectedLayoutOption.set(LayoutOptions.COMBINED_TX_RX);
        selTxCharSendingOption.set(TxCharSendingOptions.SEND_TX_CHARS_ON_ENTER);
    }

}
