package ninja.mbedded.ninjaterm.util.encodingUtils;

import java.util.List;

/**
 * Created by gbmhu on 2016-10-14.
 */
public class EncodingUtils {

    public enum ReturnId {
        OK,
        STRING_DID_NOT_HAVE_EVEN_NUMBER_OF_CHARS,
        INVALID_CHAR,
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

           int top4Bits = Character.digit(hexString.charAt(i), 16);
           if(top4Bits == -1) {
               returnResult.id = ReturnId.INVALID_CHAR;
               return;
           }

           int bot4Bits = Character.digit(hexString.charAt(i+1), 16);
           if(bot4Bits == -1) {
               returnResult.id = ReturnId.INVALID_CHAR;
               return;
           }

           output.add((byte) ((top4Bits << 4)
                   + bot4Bits));
       }

       returnResult.id = ReturnId.OK;

   }
}
