package ninja.mbedded.ninjaterm.model.terminal.txRx;

import ninja.mbedded.ninjaterm.util.rxProcessing.streamedData.StreamedData;

/**
 * Interface for a listener that wants to be informed about new "streamed data" either being
 * received from the serial port or sent to it.
 *
 * The controller for the TX/RX data view will typically listen for this and update
 * the RX data being displayed appropriately.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-29
 * @last-modified   2016-11-16
 */
public interface StreamedDataListener {
    void run(StreamedData streamedData);
}
