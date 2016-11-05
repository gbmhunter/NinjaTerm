package ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx.macros;

import javafx.beans.binding.Bindings;
import javafx.beans.value.ChangeListener;
import javafx.fxml.FXML;
import javafx.scene.control.CheckBox;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Control;
import javafx.scene.control.RadioButton;
import javafx.util.converter.NumberStringConverter;
import jfxtras.scene.control.ToggleGroupValue;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.model.terminal.txRx.display.Display;
import ninja.mbedded.ninjaterm.util.javafx.applyTextField.ApplyTextField;
import ninja.mbedded.ninjaterm.util.tooltip.TooltipUtil;
import org.controlsfx.validation.Severity;
import org.controlsfx.validation.ValidationResult;
import org.controlsfx.validation.ValidationSupport;
import org.controlsfx.validation.Validator;

/**
 * View controller for the "display" settings pop-up window.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-11-05
 * @last-modified 2016-11-05
 */
public class MacrosViewController {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//




    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//


    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public MacrosViewController() {
    }

    public void init(Model model, Terminal terminal) {



    }
}
