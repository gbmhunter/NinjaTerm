package ninja.mbedded.ninjaterm.managers;

import jssc.SerialPort;
import jssc.SerialPortException;
import jssc.SerialPortList;

/**
 * Manager for the system COM ports.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-07-16
 * @last-modified   2016-07-16
 */
public class ComPortManager {

    public String[] scan() {
        return SerialPortList.getPortNames();
    }

}
