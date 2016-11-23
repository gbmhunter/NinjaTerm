package ninja.mbedded.ninjaterm.model.terminal.txRx;


/**
 * Interface for listeners listening for when RX data needs to be cleared from the UI.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-30
 * @last-modified   2016-10-07
 */
public interface DataClearedListener {
    void run();
}
