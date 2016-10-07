package ninja.mbedded.ninjaterm.model.terminal.txRx;

import ninja.mbedded.ninjaterm.util.streamedText.StreamedText;

/**
 * Interface for a listener that wants to be informed about new "streamed text" being
 * received from the serial port.
 *
 * The controller for the TX/RX data view will typically listen for this and update
 * the RX data being displayed appropriately.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-29
 * @last-modified   2016-10-06
 */
public interface NewStreamedTextListener {
    void run(StreamedText streamedText);
}
