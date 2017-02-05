package ninja.mbedded.ninjaterm.util.debugging;

import java.nio.charset.Charset;

/**
 * Various utility methods that help with debugging.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @last-modified 2017-01-31
 * @since 2016-09-29
 */
public class Debugging {

    public static String toHexString(String stringOfChars) {

        // Uses UTF-8 charset
        byte[] bytes = stringOfChars.getBytes(Charset.forName("UTF-8"));

        StringBuilder output = new StringBuilder();
        for(byte aByte : bytes) {
            output.append(String.format("%x, ", aByte));
        }

        return output.toString();
    }

    /**
     * Converts all non-printable characters (.e.g \r, \n, ...) in the provided string into
     * "?".
     * @param input     The input string to convert non-printable chars with.
     * @return          The resultant string with all non-printable chars as "?".
     */
    public static String convertNonPrintable(String input) {
        // Regex pattern \\p{Cntrl} will match all non-printable chars
        return input.replaceAll("\\p{Cntrl}", "?");
    }

    /**
     * Converts a string array into a single comma-delimited string with
     * curly braces at each end (similar to JSON).
     * @param stringA
     * @return
     */
    public static String toString(String[] stringA) {
        StringBuilder output = new StringBuilder();
        output.append("{ ");
        for (String string : stringA) {
            output.append(string + ", ");
        }
        output.append("}");
        return output.toString();
    }

    public static String toString(byte[] byteA) {
        StringBuilder output = new StringBuilder();
        output.append("{ ");
        for (byte singleByte : byteA) {
            output.append(String.format("%02x", singleByte) + ", ");
        }
        output.append("}");
        return output.toString();
    }

}
