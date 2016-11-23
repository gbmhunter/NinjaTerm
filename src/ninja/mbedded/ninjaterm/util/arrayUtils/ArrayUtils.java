package ninja.mbedded.ninjaterm.util.arrayUtils;

import javafx.collections.ObservableList;

/**
 * Contains static methods useful for converting between different types of arrays and
 * lists.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-11-21
 * @last-modified 2016-11-21
 */
public class ArrayUtils {

    public static byte[] fromObservableListToByteArray(ObservableList<Byte> observableList) {

        byte[] data = new byte[observableList.size()];
        int i = 0;
        for (Byte singleByte : observableList) {
            data[i++] = singleByte;
        }

        return data;
    }

}
