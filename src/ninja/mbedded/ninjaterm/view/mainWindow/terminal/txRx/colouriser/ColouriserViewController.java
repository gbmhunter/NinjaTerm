package ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx.colouriser;

import javafx.beans.binding.Bindings;
import javafx.fxml.FXML;
import javafx.scene.control.RadioButton;
import jfxtras.scene.control.ToggleGroupValue;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.model.terminal.txRx.formatting.Formatting;

/**
 * Controller for the formatting pop-up window.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @last-modified 2016-09-26
 * @since 2016-09-26
 */
public class ColouriserViewController {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//
    @FXML
    private RadioButton carriageReturnCheckBox;
    @FXML
    private RadioButton newLineCheckBox;
    @FXML
    private RadioButton carriageReturnAndNewLineCheckBox;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    Model model;
    Terminal terminal;

    ToggleGroupValue<Formatting.EnterKeyBehaviour> enterKeyBehaviourTGV = new ToggleGroupValue<>();

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public ColouriserViewController() {
    }

    public void init(Model model, Terminal terminal) {

        this.model = model;
        this.terminal = terminal;

        //==============================================//
        //========= ENTER KEY BEHAVIOUR SETUP ==========//
        //==============================================//

        enterKeyBehaviourTGV.add(carriageReturnCheckBox, Formatting.EnterKeyBehaviour.CARRIAGE_RETURN);
        enterKeyBehaviourTGV.add(newLineCheckBox, Formatting.EnterKeyBehaviour.NEW_LINE);
        enterKeyBehaviourTGV.add(carriageReturnAndNewLineCheckBox, Formatting.EnterKeyBehaviour.CARRIAGE_RETURN_AND_NEW_LINE);

        Bindings.bindBidirectional(enterKeyBehaviourTGV.valueProperty(), terminal.txRx.formatting.selEnterKeyBehaviour);

    }
}
