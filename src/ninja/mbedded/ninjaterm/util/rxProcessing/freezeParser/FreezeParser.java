package ninja.mbedded.ninjaterm.util.rxProcessing.freezeParser;

import javafx.beans.property.SimpleBooleanProperty;
import ninja.mbedded.ninjaterm.util.rxProcessing.streamedData.StreamedData;

/**
 * Very simple class which can freeze input streamed data, and prevent it from
 * being released.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-10-17
 * @last-modified 2016-10-17
 */
public class FreezeParser {

    public SimpleBooleanProperty isFrozen = new SimpleBooleanProperty(false);

    public void parse(StreamedData inputData, StreamedData releasedData) {

        if(isFrozen.get())
            // Do not release any data
            return;
        else {
            // Release all data
            releasedData.shiftDataIn(inputData, inputData.getText().length(), StreamedData.MarkerBehaviour.NOT_FILTERING);
        }

    }

}
