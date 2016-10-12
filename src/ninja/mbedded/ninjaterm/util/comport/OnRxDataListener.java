package ninja.mbedded.ninjaterm.util.comport;


/**
 * Listeners for when RX data is received.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-07-17
 * @last-modified   2016-10-07
 */
public interface OnRxDataListener {

    void run(byte[] rxData);

}
