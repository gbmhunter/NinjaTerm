package ninja.mbedded.ninjaterm.model.terminal.txRx;

/**
 * Interface for listeners listening for when raw data has been received from the COM port.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-22
 * @last-modified   2016-10-07
 */
public interface RawDataReceivedListener {
    void run(String data);
}
