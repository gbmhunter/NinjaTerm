package ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx.colouriser;

import javafx.beans.binding.Bindings;
import javafx.fxml.FXML;
import javafx.scene.control.CheckBox;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.util.Decoding.DecodingOptions;

/**
 * Controller for the Colouriser pop-up window.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-09-26
 * @last-modified 2016-10-07
 */
public class ColouriserViewController {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    private CheckBox parseAnsiEscapeSequencesCheckBox;

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

        Bindings.bindBidirectional(parseAnsiEscapeSequencesCheckBox.selectedProperty(), terminal.txRx.colouriser.ansiEscapeSequencesEnabled);

        // We only want this checkbox control enabled when the decoding mode is set to ASCII
        terminal.decoder.decodingOption.addListener((observable, oldValue, newValue) -> {
            if(newValue == DecodingOptions.ASCII) {
                parseAnsiEscapeSequencesCheckBox.setDisable(false);
            } else {
                parseAnsiEscapeSequencesCheckBox.setDisable(true);
            }
        });

    }
}
