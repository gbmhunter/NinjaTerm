package ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx.colouriser;

import javafx.beans.binding.Bindings;
import javafx.fxml.FXML;
import javafx.scene.control.CheckBox;
import javafx.scene.control.RadioButton;
import jfxtras.scene.control.ToggleGroupValue;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.model.terminal.txRx.formatting.Formatting;

/**
 * Controller for the Colouriser pop-up window.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-09-26
 * @last-modified 2016-09-27
 */
public class ColouriserViewController {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//
    @FXML
    private CheckBox parseAnsiEscapeSequences;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    Model model;
    Terminal terminal;

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public ColouriserViewController() {
    }

    public void init(Model model, Terminal terminal) {

        this.model = model;
        this.terminal = terminal;

        //==============================================//
        //============ ANSI ESCAPE SEQ SETUP ===========//
        //==============================================//

        Bindings.bindBidirectional(parseAnsiEscapeSequences.selectedProperty(), terminal.txRx.colouriser.ansiEscapeSequencesEnabled);

    }
}
