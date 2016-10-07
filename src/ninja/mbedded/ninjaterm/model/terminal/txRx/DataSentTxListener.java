package ninja.mbedded.ninjaterm.model.terminal.txRx;

/**
 * Interface for listeners listening for when TX data is sent to the COM port.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-10-07
 * @last-modified   2016-10-07
 */
public interface DataSentTxListener {
    void run(String txData);
}
