package ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx.filters;

import javafx.beans.binding.Bindings;
import javafx.beans.value.ChangeListener;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.*;
import javafx.scene.layout.VBox;
import javafx.util.converter.NumberStringConverter;
import jfxtras.scene.control.ToggleGroupValue;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.model.terminal.txRx.display.Display;
import ninja.mbedded.ninjaterm.model.terminal.txRx.filters.Filters;
import ninja.mbedded.ninjaterm.util.Decoding.Decoder;
import ninja.mbedded.ninjaterm.util.Decoding.DecodingOptions;
import ninja.mbedded.ninjaterm.util.tooltip.TooltipUtil;
import org.controlsfx.validation.Severity;
import org.controlsfx.validation.ValidationResult;
import org.controlsfx.validation.ValidationSupport;
import org.controlsfx.validation.Validator;

import java.io.IOException;

/**
 * Backend for the filters pop-up window.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-09-21
 * @last-modified 2016-09-23
 */
public class FiltersViewController {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    private TextField filterTextTextField;

    @FXML
    private RadioButton applyToNewRxDataOnlyCheckBox;

    @FXML
    private RadioButton applyToBothBufferedAndNewRxDataCheckBox;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    private Model model;
    private Terminal terminal;

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public FiltersViewController() {
    }

    public void init(Model model, Terminal terminal) {

        //==============================================//
        //======= ATTACH LISTENER TO FILTER TEXT =======//
        //==============================================//

        // Bind the text in the filter text textfield to the string in the model
        filterTextTextField.textProperty().bindBidirectional(terminal.txRx.filters.filterText);

        //==============================================//
        //=============== RADIOBUTTON SETUP ============//
        //==============================================//

        ToggleGroupValue<Filters.FilterApplyTypes> filterApplyTypesTGV = new ToggleGroupValue<>();
        filterApplyTypesTGV.add(applyToNewRxDataOnlyCheckBox, Filters.FilterApplyTypes.APPLY_TO_NEW_RX_DATA_ONLY);
        filterApplyTypesTGV.add(applyToBothBufferedAndNewRxDataCheckBox, Filters.FilterApplyTypes.APPLY_TO_BUFFERED_AND_NEW_RX_DATA);

        Bindings.bindBidirectional(filterApplyTypesTGV.valueProperty(), terminal.txRx.filters.filterApplyType);

    }
}
