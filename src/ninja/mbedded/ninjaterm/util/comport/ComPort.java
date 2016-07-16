package ninja.mbedded.ninjaterm.util.comport;

import jssc.SerialPort;
import jssc.SerialPortException;
import ninja.mbedded.ninjaterm.interfaces.OnRxDataListener;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

/**
 * Object that represents a single COM port.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-07-16
 * @last-modified   2016-07-16
 */
public class ComPort {



    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    String comPortName;

    /**
     * The jSSC object which is actually used to control the COM port.
     */
    SerialPort serialPort;

    List<OnRxDataListener> onRxDataListeners = new ArrayList<>();

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public ComPort(String comPortName) {
        this.comPortName = comPortName;
    }

    public void open() {
        serialPort = new SerialPort(comPortName);

        try {
            serialPort.openPort();

            serialPort.setParams(SerialPort.BAUDRATE_9600,
                    SerialPort.DATABITS_8,
                    SerialPort.STOPBITS_1,
                    SerialPort.PARITY_NONE);


        } catch (SerialPortException e) {
            throw new RuntimeException(e);
        }

        try {
            serialPort.addEventListener((serialPortEvent) -> {
                if(serialPortEvent.isRXCHAR()){
                    System.out.println("Data received!");

                    int numBytes = serialPortEvent.getEventValue();

                    byte[] rxData;
                    try {
                        rxData = serialPort.readBytes(numBytes);
                    } catch (SerialPortException e) {
                        throw new RuntimeException(e);
                    }

                    System.out.println("rxData = " + rxData);

                    for(Iterator<OnRxDataListener> it = onRxDataListeners.iterator(); it.hasNext(); ) {
                        OnRxDataListener onRxDataListener = it.next();
                        onRxDataListener.onRxData(rxData);
                    }
                }
            });
        } catch (SerialPortException e) {
            throw new RuntimeException(e);
        }
    }

    public void setParams(BaudRates baudRate) {

    }

    public void addOnRxDataListener(OnRxDataListener onRxDataListener) {
        onRxDataListeners.add(onRxDataListener);
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
