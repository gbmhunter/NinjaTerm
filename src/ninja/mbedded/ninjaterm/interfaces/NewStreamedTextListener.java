package ninja.mbedded.ninjaterm.interfaces;

import ninja.mbedded.ninjaterm.util.streamedText.StreamedText;
import ninja.mbedded.ninjaterm.util.streamedText.StreamedTextV2;

/**
 * Created by gbmhu on 2016-09-29.
 */
public interface NewStreamedTextListener {
    void run(StreamedTextV2 streamedText);
}
