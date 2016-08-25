package ninja.mbedded.ninjaterm.util.Decoding;

/**
 * Enumerates the available decoding options for incoming data. These will
 * be shown in the decoding popup combobox.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-08-25
 * @last-modified   2016-08-25
 */
public enum DecodingOptions {

    UTF8("UTF-8"),
    HEX("Hex"),
    ;

    private String label;

    DecodingOptions(String label) {
        this.label = label;
    }

    public String toString() {
        return label;
    }

}
