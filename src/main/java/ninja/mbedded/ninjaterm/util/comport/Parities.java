package ninja.mbedded.ninjaterm.util.comport;

/**
 * Enumerates the available parity options for a COM port. These will be shown by default
 * in the parity selection combobox on the comSettings screen.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-07-16
 * @last-modified   2016-07-16
 */
public enum Parities {

    NONE("None"),
    EVEN("Even"),
    ODD("Odd"),
    MARK("Mark"),
    SPACE("Space");

    private String label;

    Parities(String label) {
        this.label = label;
    }

    @Override
    public String toString() {
        return label;
    }

}
