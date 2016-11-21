package ninja.mbedded.ninjaterm.model.terminal.txRx.macros;

/**
 * Created by gbmhu on 2016-11-08.
 */
public enum Encodings {

    ASCII("ASCII"),
    HEX("Hex"),
    ;

    private String label;

    Encodings(String label) {
        this.label = label;
    }

    @Override
    public String toString() {
        return label;
    }

}
