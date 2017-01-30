package ninja.mbedded.ninjaterm.util.comport;

//import jssc.SerialPort;

import jssc.SerialPortException;
import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import org.slf4j.Logger;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

/**
 * An RX worker is used because the to gather RX data so that we have complete
 * control over the thread and how often it will run.
 *
 * Using the event-based way with jssc didn't work as performance took a hit
 * (GUI stopped being responsive) when there was a high RX data throughput.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @last-modified 2017-01-30
 * @since 2017-01-30
 */
public class RxWorker implements Runnable {

    ComPort comPort;
    public jssc.SerialPort serialPort;

    public List<OnRxDataListener> onRxDataListeners = new ArrayList<>();

    private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

    RxWorker(
            ComPort comPort,
            jssc.SerialPort serialPort) {
        this.comPort = comPort;
    }

    @Override
    public void run() {

        while(true) {
            //logger.debug("run() called.");

            // Check for data
            byte[] rxData;
            try {
                rxData = serialPort.readBytes();
            } catch (SerialPortException e) {
                throw new RuntimeException(e);
            }

            // rxData will be null if there are no bytes in RX buffer
            if(rxData != null) {
                //logger.debug("Read " + rxData.length + " bytes of RX data.");

                for (Iterator<OnRxDataListener> it = comPort.onRxDataListeners.iterator(); it.hasNext(); ) {
                    OnRxDataListener onRxDataListener = it.next();
                    onRxDataListener.run(rxData);
                }
            }

            //logger.debug("Sleeping...");
            try {
                Thread.sleep(200);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
        }
    }

}
