package ninja.mbedded.ninjaterm.util.rxProcessing.freezeParser;

import javafx.beans.property.SimpleBooleanProperty;
import ninja.mbedded.ninjaterm.util.rxProcessing.streamedText.StreamedData;

/**
 * Created by gbmhu on 2016-10-17.
 */
public class FreezeParser {

    public SimpleBooleanProperty isFrozen = new SimpleBooleanProperty(false);

    public void parser(StreamedData inputData, StreamedData releasedData) {

        if(isFrozen.get())
            return;
        else {
            releasedData.shiftDataIn(inputData, inputData.getText().length());
        }

    }

}
