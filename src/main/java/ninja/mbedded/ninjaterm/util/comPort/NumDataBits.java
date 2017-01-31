package ninja.mbedded.ninjaterm.util.comPort;

/**
 * Enumerates the available num. data bits options for a COM port. These will be shown by default
 * in the num. data bits selection combobox on the comSettings screen.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-07-17
 * @last-modified   2016-07-17
 */
public enum NumDataBits {

    FIVE("5"),
    SIX("6"),
    SEVEN("7"),
    EIGHT("8");

    private String label;

    NumDataBits(String label) {
        this.label = label;
    }

    @Override
    public String toString() {
        return label;
    }

}
