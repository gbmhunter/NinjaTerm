package ninja.mbedded.ninjaterm.util.comport;

/**
 * Enumerates the available num. stop bit options for a COM port. These will be shown by default
 * in the num. stop bits selection combobox on the ComSettings screen.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-07-17
 * @last-modified   2016-07-17
 */
public enum NumStopBits {

    ONE("1"),
    ONE_POINT_FIVE("1.5"),
    TWO("2");

    private String label;

    NumStopBits(String label) {
        this.label = label;
    }

    @Override
    public String toString() {
        return label;
    }

}
