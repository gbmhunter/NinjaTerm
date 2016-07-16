package ninja.mbedded.ninjaterm.util.comport;

/**
 * Enumerates most of the popular baud rates. These will be shown by default
 * in the baud rate selection combobox.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-07-16
 * @last-modified   2016-07-16
 */
public enum BaudRates {

    BAUD_9600("9600"),
    BAUD_38400("38400"),
    BAUD_115200("115200");

    private String label;

    BaudRates(String label) {
        this.label = label;
    }

    @Override
    public String toString() {
        return label;
    }

}
