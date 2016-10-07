package ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx.colouriser;

import javafx.beans.binding.Bindings;
import javafx.fxml.FXML;
import javafx.scene.control.CheckBox;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.util.Decoding.DecodingOptions;
import ninja.mbedded.ninjaterm.util.tooltip.TooltipUtil;

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
    private CheckBox parseAnsiEscapeCodesCheckBox;

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

        Bindings.bindBidirectional(parseAnsiEscapeCodesCheckBox.selectedProperty(), terminal.txRx.colouriser.ansiEscapeCodesEnabled);

        // We only want this checkbox control enabled when the decoding mode is set to ASCII
        terminal.decoder.decodingOption.addListener((observable, oldValue, newValue) -> {
            if(newValue == DecodingOptions.ASCII) {
                parseAnsiEscapeCodesCheckBox.setDisable(false);
            } else {
                parseAnsiEscapeCodesCheckBox.setDisable(true);
            }
        });

        TooltipUtil.addDefaultTooltip(parseAnsiEscapeCodesCheckBox, "If this is checked, ANSI escape codes in the RX data will be parsed. Text colour based ANSI escape codes will colour text as appropriate. All other ANSI escape codes will be removed from the data stream but ignored. ANSI escape codes can only be enabled if the decoding mode in the Formatting popover is set to \"ASCII\".");

    }
}
