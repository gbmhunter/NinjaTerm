package ninja.mbedded.ninjaterm.interfaces;


/**
 * Listeners for when RX data is received.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-07-17
 * @last-modified   2016-09-25
 */
public interface OnRxDataListener {

    void onRxData(byte[] rxData);

}
