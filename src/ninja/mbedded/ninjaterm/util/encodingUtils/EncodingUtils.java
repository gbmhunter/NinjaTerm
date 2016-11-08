package ninja.mbedded.ninjaterm.util.encodingUtils;

import java.util.List;

/**
 * Created by gbmhu on 2016-10-14.
 */
public class EncodingUtils {

    public enum ReturnId {
        OK,
        STRING_DID_NOT_HAVE_EVEN_NUMBER_OF_CHARS
    }

    public static class ReturnResult {
        public ReturnId id;
    }

   public static void hexStringToByteArray(String hexString, List<Byte> output, ReturnResult returnResult) {
       output.clear();

       int len = hexString.length();
       // Make sure the hex string has an even number of characters
       if(len % 2 != 0) {
           returnResult.id = ReturnId.STRING_DID_NOT_HAVE_EVEN_NUMBER_OF_CHARS;
           return;
       }

       for (int i = 0; i < len; i += 2) {
           output.add((byte) ((Character.digit(hexString.charAt(i), 16) << 4)
                   + Character.digit(hexString.charAt(i+1), 16)));
       }

       returnResult.id = ReturnId.OK;

   }
}
