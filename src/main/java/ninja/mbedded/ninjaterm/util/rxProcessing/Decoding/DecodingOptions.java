package ninja.mbedded.ninjaterm.util.rxProcessing.Decoding;

/**
 * Enumerates the available decoding options for incoming data. These will
 * be shown in the decoding popup combobox.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-08-25
 * @last-modified   2016-10-16
 */
public enum DecodingOptions {

    ASCII("ASCII"), /* Control chars are swallowed */
    ASCII_WITH_CONTROL_CHARS("ASCII with control chars"), /* Control chars are shown as Unicode symbols */
    HEX("Hex"), /* Data displayed as hex */
    ;

    private String label;

    DecodingOptions(String label) {
        this.label = label;
    }

    public String toString() {
        return label;
    }

}
