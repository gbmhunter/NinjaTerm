package ninja.mbedded.ninjaterm.util;

import jssc.SerialPort;
import jssc.SerialPortException;

/**
 * Obhect that represents a single COM port.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @last-modified 2016-07-16
 * @since 2016-07-16
 */
public class ComPort {

    String comPortName;

    SerialPort serialPort;

    public ComPort(String comPortName) {
        this.comPortName = comPortName;
    }

    public void open() {
        serialPort = new SerialPort(comPortName);

        try {
            serialPort.openPort();
        } catch (SerialPortException e) {
            throw new RuntimeException(e);
        }
    }

    public void close() {
        if (serialPort == null) {
            return;
        }

        try {
            serialPort.closePort();
        } catch (SerialPortException e) {
            throw new RuntimeException(e);
        }
    }
}
