package ninja.mbedded.ninjaterm.model.terminal.txRx.filters;

import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;

/**
 * Model containing data and logic for the filtering of TX/RX data.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-16
 * @last-modified   2016-09-30
 */
public class Filters {

    public SimpleStringProperty filterText = new SimpleStringProperty("");

    public enum FilterApplyTypes {
        APPLY_TO_NEW_RX_DATA_ONLY,
        APPLY_TO_BUFFERED_AND_NEW_RX_DATA,
    }

    public SimpleObjectProperty<FilterApplyTypes> filterApplyType = new SimpleObjectProperty<>(FilterApplyTypes.APPLY_TO_BUFFERED_AND_NEW_RX_DATA);

    public Filters() {

    }

}
