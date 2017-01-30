package ninja.mbedded.ninjaterm.util.comport;

import jssc.SerialPort;
import jssc.SerialPortEvent;
import jssc.SerialPortException;
import jssc.SerialPortList;
import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import ninja.mbedded.ninjaterm.util.rxProcessing.Decoding.BytesToString;
import org.slf4j.Logger;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

/**
 * Object that represents a single COM port.
 * <p>
 * This acts as a wrapper around the real serial port library (which at the moment is
 * jSSC). This is done because it is likely that the serial port library will change in
 * the future, and this means the code changes just have to occur in this file.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @last-modified 2016-11-22
 * @since 2016-07-16
 */
public class ComPort {

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    private String name;

    private boolean portOpen = false;

    public boolean isPortOpen() {
        return portOpen;
    }

    /**
     * The jSSC object which is actually used to control the COM port. This is a serial-port library
     * dependent variable (could be changed if another serial port library is to be used).
     */
    private SerialPort serialPort;

    private BaudRates baudRate;

    public BaudRates getBaudRate() {
        return baudRate;
    }

    private NumDataBits numDataBits;

    private Parities parity;

    public Parities getParity() {
        return parity;
    }

    private NumStopBits numStopBits;

    public NumStopBits getNumStopBits() {
        return numStopBits;
    }

    public List<OnRxDataListener> onRxDataListeners;

    private RxWorker rxWorker;

    private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public ComPort() {

        // Create an RX data worker (will run in a separate thread)
        rxWorker = new RxWorker(this, serialPort);

        // Expose the RxWorker's listener to the public
        onRxDataListeners = rxWorker.onRxDataListeners;

    }

    public ComPort createNew() {
        return new ComPort();
    }

    /**
     * Scans the computer for COM ports, and returns a list of their names.
     *
     * @return
     */
    public String[] scan() {

        //com.fazecast.jSerialComm.SerialPort comPort = com.fazecast.jSerialComm.SerialPort.getCommPorts()[0];
        //System.out.println(comPort.getDescriptivePortName());

        return SerialPortList.getPortNames();

    }

    public void setName(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public void open() throws ComPortException {

        // Create a new jSSC serial port object
        serialPort = new SerialPort(name);

        try {
            serialPort.openPort();

        } catch (SerialPortException e) {
            if (e.getExceptionType() == SerialPortException.TYPE_PORT_BUSY) {
                throw new ComPortException(ComPortException.ExceptionType.COM_PORT_BUSY);
            } else if (e.getExceptionType() == SerialPortException.TYPE_PORT_NOT_FOUND) {
                throw new ComPortException(ComPortException.ExceptionType.COM_PORT_DOES_NOT_EXIST);
            } else
                throw new RuntimeException(e);
        }

        /*try {
            serialPort.addEventListener(serialPortEvent -> {
                onSerialPortEvent(serialPortEvent);
            });
        } catch (SerialPortException e) {
            throw new RuntimeException(e);
        }*/

        // Start RX thread (first give it the
        // serial port object)
        rxWorker.serialPort = serialPort;
        Thread thread = new Thread(rxWorker);
        thread.start();

        portOpen = true;
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
        switch (baudRate) {
            case BAUD_110:
                jsscBaudRate = 110;
                break;
            case BAUD_300:
                jsscBaudRate = 300;
                break;
            case BAUD_600:
                jsscBaudRate = 600;
                break;
            case BAUD_1200:
                jsscBaudRate = 1200;
                break;
            case BAUD_2400:
                jsscBaudRate = 2400;
                break;
            case BAUD_4800:
                jsscBaudRate = 4800;
                break;
            case BAUD_9600:
                jsscBaudRate = 9600;
                break;
            case BAUD_14400:
                jsscBaudRate = 14400;
                break;
            case BAUD_19200:
                jsscBaudRate = 19200;
                break;
            case BAUD_38400:
                jsscBaudRate = 38400;
                break;
            case BAUD_57600:
                jsscBaudRate = 57600;
                break;
            case BAUD_115200:
                jsscBaudRate = 115200;
                break;
            case BAUD_128000:
                jsscBaudRate = 128000;
                break;
            case BAUD_256000:
                jsscBaudRate = 256000;
                break;
            default:
                throw new RuntimeException("Baud rate unrecognised!");
        }

        //==============================================//
        //====== APP DATA BITS -> jSSC DATA BITS =======//
        //==============================================//

        int jsscDataBits;
        switch (numDataBits) {
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
        switch (parity) {
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
        switch (numStopBits) {
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

    public void sendData(byte[] data) {
        logger.debug("sendData() called with data = " + BytesToString.bytesToHex(data));

        // Send the data to the serial port library
        try {
            serialPort.writeBytes(data);
        } catch (SerialPortException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * This will be called by jSSC when any "serial port event" occurs.
     * This maybe because RX data has been received, or the state of the signalling
     * wires (e.g. CTS, RTS) has changed.
     *
     * @param serialPortEvent
     */
    /*public void onSerialPortEvent(SerialPortEvent serialPortEvent) {

        if (serialPortEvent.isRXCHAR()) {
            //System.out.println("Data received!");

            int numBytes = serialPortEvent.getEventValue();

            byte[] rxData;
            try {
                rxData = serialPort.readBytes(numBytes);
            } catch (SerialPortException e) {
                throw new RuntimeException(e);
            }

            //System.out.println("rxData = " + Arrays.toString(rxData));

            for (Iterator<OnRxDataListener> it = onRxDataListeners.iterator(); it.hasNext(); ) {
                OnRxDataListener onRxDataListener = it.next();
                onRxDataListener.run(rxData);
            }
        }
    }*/

    public void close() throws ComPortException {
        if (serialPort == null) {
            return;
        }

        try {
            serialPort.closePort();
        } catch (SerialPortException e) {

            if (e.getExceptionType() == SerialPortException.TYPE_CANT_SET_MASK) {
                throw new ComPortException(ComPortException.ExceptionType.COM_PORT_DOES_NOT_EXIST);
            }

            throw new RuntimeException(e);
        }

        portOpen = false;
    }
}
