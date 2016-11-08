package ninja.mbedded.ninjaterm.util.debugging;

import sun.nio.cs.US_ASCII;

import java.math.BigInteger;

/**
 * Various utility methods that help with debugging.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @last-modified 2016-11-08
 * @since 2016-09-29
 */
public class Debugging {

    public static String toHexString(String stringOfChars) {

        byte[] bytes = stringOfChars.getBytes(US_ASCII.defaultCharset());

        StringBuilder output = new StringBuilder();
        for(byte aByte : bytes) {
            output.append(String.format("%x, ", aByte));
        }

        return output.toString();
    }

    public static String convertNonPrintable(String input) {

        return input.replaceAll("\\p{Cntrl}", "?");
    }

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
