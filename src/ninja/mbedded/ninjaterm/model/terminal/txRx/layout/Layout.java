package ninja.mbedded.ninjaterm.model.terminal.txRx.layout;

import javafx.beans.property.SimpleObjectProperty;

/**
 * Created by gbmhu on 2016-09-16.
 */
public class Layout {

    public enum LayoutOptions {
        COMBINED_TX_RX("Combined RX/TX"),
        SEPARATE_TX_RX("Separate RX/TX"),
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

    public SimpleObjectProperty<LayoutOptions> selectedLayoutOption = new SimpleObjectProperty<>();

    public Layout() {
        selectedLayoutOption.set(LayoutOptions.COMBINED_TX_RX);
    }

}
