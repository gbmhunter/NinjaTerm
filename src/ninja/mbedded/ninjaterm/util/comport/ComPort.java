package ninja.mbedded.ninjaterm.util.comport;

import jssc.SerialPort;
import jssc.SerialPortException;
import ninja.mbedded.ninjaterm.interfaces.OnRxDataListener;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;

/**
 * Object that represents a single COM port.
 *
 * This acts as a wrapper around the real serial port library (which at the moment is
 * jSSC). This is done because it is likely that the serial port library will change in
 * the future, and this means the code changes just have to occur in this file.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-07-16
 * @last-modified   2016-07-17
 */
public class ComPort {

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    private String name;
    public String getName() {
        return name;
    }

    /**
     * The jSSC object which is actually used to control the COM port.
     */
    private SerialPort serialPort;

    private BaudRates baudRate;
    public BaudRates getBaudRate() { return baudRate; }

    private NumDataBits numDataBits;
    private Parities parity;
    private NumStopBits numStopBits;

    private List<OnRxDataListener> onRxDataListeners = new ArrayList<>();

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public ComPort(String name) {

        this.name = name;

        // Create a new jSSC serial port object
        serialPort = new SerialPort(name);

    }

    public void open() {

        try {
            serialPort.openPort();

        } catch (SerialPortException e) {
            throw new RuntimeException(e);
        }

        try {
            serialPort.addEventListener((serialPortEvent) -> {
                if (serialPortEvent.isRXCHAR()) {
                    System.out.println("Data received!");

                    int numBytes = serialPortEvent.getEventValue();

                    byte[] rxData;
                    try {
                        rxData = serialPort.readBytes(numBytes);
                    } catch (SerialPortException e) {
                        throw new RuntimeException(e);
                    }

                    System.out.println("rxData = " + Arrays.toString(rxData));

                    for (Iterator<OnRxDataListener> it = onRxDataListeners.iterator(); it.hasNext(); ) {
                        OnRxDataListener onRxDataListener = it.next();
                        onRxDataListener.onRxData(rxData);
                    }
                }
            });
        } catch (SerialPortException e) {
            throw new RuntimeException(e);
        }
    }

    public void setParams(
            BaudRates baudRate,
            NumDataBits numDataBits,
            Parities parity,
            NumStopBits numStopBits) {

        this.baudRate = baudRate;
        this.numDataBits = numDataBits;
        this.parity = parity;
        this.numStopBits = numStopBits;

        //==============================================//
        //====== APP BAUD RATE -> jSSC BAUD RATE =======//
        //==============================================//
        int jsscBaudRate;
        switch(baudRate) {
            case BAUD_9600:
                jsscBaudRate = 9600;
                break;
            case BAUD_38400:
                jsscBaudRate = 38400;
                break;
            case BAUD_115200:
                jsscBaudRate = 115200;
                break;
            default:
                throw new RuntimeException("Baud rate unrecognised!");
        }

        //==============================================//
        //====== APP DATA BITS -> jSSC DATA BITS =======//
        //==============================================//

        int jsscDataBits;
        switch(numDataBits) {
            case FIVE:
                jsscDataBits = 5;
                break;
            case SIX:
                jsscDataBits = 6;
                break;
            case SEVEN:
                jsscDataBits = 7;
                break;
            case EIGHT:
                jsscDataBits = 8;
                break;
            default:
                throw new RuntimeException("Num. data bits unrecognised!");
        }

        //==============================================//
        //========= APP PARITY -> jSSC PARITY ==========//
        //==============================================//

        int jsscParity;
        switch(parity) {
            case NONE:
                jsscParity = SerialPort.PARITY_NONE;
                break;
            case EVEN:
                jsscParity = SerialPort.PARITY_EVEN;
                break;
            case ODD:
                jsscParity = SerialPort.PARITY_ODD;
                break;
            case MARK:
                jsscParity = SerialPort.PARITY_MARK;
                break;
            case SPACE:
                jsscParity = SerialPort.PARITY_SPACE;
                break;
            default:
                throw new RuntimeException("Parity unrecognised!");
        }

        //==============================================//
        //====== APP STOP BITS -> jSSC STOP BITS =======//
        //==============================================//

        int jsscNumStopBits;
        switch(numStopBits) {
            case ONE:
                jsscNumStopBits = SerialPort.STOPBITS_1;
                break;
            case ONE_POINT_FIVE:
                jsscNumStopBits = SerialPort.STOPBITS_1_5;
                break;
            case TWO:
                jsscNumStopBits = SerialPort.STOPBITS_2;
                break;
            default:
                throw new RuntimeException("Parity unrecognised!");
        }

        try {
            serialPort.setParams(
                    jsscBaudRate,
                    jsscDataBits,
                    jsscNumStopBits,
                    jsscParity);
        } catch (SerialPortException e) {
            throw new RuntimeException(e);
        }

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
