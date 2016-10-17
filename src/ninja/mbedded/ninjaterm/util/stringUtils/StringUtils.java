package ninja.mbedded.ninjaterm.util.stringUtils;

/**
 * Created by gbmhu on 2016-10-14.
 */
public class StringUtils {

    /**
     * Trims a string to the provided number of characters. Removes characters from the start of the string
     * (the "old" chars).
     *
     * @param data
     * @param desiredLength
     * @return The trimmed string.
     */
    public static String removeOldChars(String data, int desiredLength) {
        return data.substring(data.length() - desiredLength, data.length());
    }

}
