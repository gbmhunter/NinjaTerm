package ninja.mbedded.ninjaterm.util.mutable;

/**
 * A class which provides a mutable integer object.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-10-25
 * @last-modified   2016-10-25
 */
public class MutableInteger {
    private int value;

    public MutableInteger(int value) {
        this.value = value;
    }

    public void set(int value) {
        this.value = value;
    }

    public int intValue() {
        return value;
    }
}
