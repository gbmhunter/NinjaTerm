package ninja.mbedded.ninjaterm.model.terminal.txRx.formatting;

import javafx.beans.property.SimpleObjectProperty;

/**
 * Model containing data and logic for the formatting of TX/RX data.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @last-modified 2016-11-21
 * @since 2016-09-26
 */
public class Formatting {

    //================================================================================================//
    //========================================= CLASS ENUMS ==========================================//
    //================================================================================================//

    public enum EnterKeyBehaviour {
        CARRIAGE_RETURN,
        NEW_LINE,
        CARRIAGE_RETURN_AND_NEW_LINE,
    }

    public enum TxCharSendingOptions {
        SEND_TX_CHARS_IMMEDIATELY,
        SEND_TX_CHARS_ON_ENTER
    }

    //================================================================================================//
    //========================================= CLASS FIELDS =========================================//
    //================================================================================================//

    /**
     * Controls what is send to the COM port (TX) when "ENTER" is pressed.
     *
     * Sending a new line is the most common behaviour.
     */
    public SimpleObjectProperty<EnterKeyBehaviour> selEnterKeyBehaviour = new SimpleObjectProperty<>(EnterKeyBehaviour.NEW_LINE);

    public SimpleObjectProperty<TxCharSendingOptions> selTxCharSendingOption = new SimpleObjectProperty<>(TxCharSendingOptions.SEND_TX_CHARS_IMMEDIATELY);

}
