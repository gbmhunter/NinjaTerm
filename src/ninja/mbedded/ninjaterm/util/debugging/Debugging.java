package ninja.mbedded.ninjaterm.util.debugging;

import sun.nio.cs.US_ASCII;

import java.math.BigInteger;

/**
 * Created by gbmhu on 2016-09-29.
 */
public class Debugging {

    public static String toHexString(String stringOfChars) {

        byte[] bytes = stringOfChars.getBytes(US_ASCII.defaultCharset());

        String output = "";
        for(byte aByte : bytes) {
            output += String.format("%x, ", aByte);
        }

        return output;
    }

    public static String convertNonPrintable(String input) {

        return input.replaceAll("\\p{Cntrl}", "?");
    }

    public static String toString(String[] stringA) {
        String output = "{ ";
        for (String string : stringA) {
            output = output + string + ", ";
        }
        return output;
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
