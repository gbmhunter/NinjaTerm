package ninja.mbedded.ninjaterm.util.Decoding;

import java.io.UnsupportedEncodingException;

/**
 * Parsing engine for converting raw bytes received through the COM port into
 * displayable data to the user. The user can change the decoding type (
 * UTF-8, hex, ...).
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-08-25
 * @last-modified   2016-08-25
 */
public class Decoder {

    public DecodingOptions decodingOption = DecodingOptions.UTF8;

    public Decoder() {

    }

    public String parse(byte[] data) {

        String output;
        if(decodingOption == DecodingOptions.UTF8) {
            try {
                output = new String(data, "UTF-8");
            } catch (UnsupportedEncodingException e) {
                throw new RuntimeException(e);
            }
        } else {
            throw new RuntimeException("formatting option was not recognised.");
        }

        return output;

    }

}
