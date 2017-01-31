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
 * This worker can be stopped with stopRunning().
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @last-modified 2017-01-30
 * @since 2017-01-30
 */
public class RxWorker implements Runnable {

    /**
     * The wait time (in milliseconds) between calls to read whatever
     * is in the RX buffer. Lowering this increases response time of data
     * from port to user but decreases performance of app.
     */
    public final int WAIT_TIME_BETWEEN_RX_READS_MS = 200;

    /**
     * WARNING: This must be set before run() is called.
     */
    public jssc.SerialPort serialPort;

    /**
     * Listeners which will be called when RX data is received.
     */
    public List<OnRxDataListener> onRxDataListeners = new ArrayList<>();

    /**
     * run() checks this to see when it should return. This needs to be volatile
     * because it could be set to true by other threads.
     */
    private volatile boolean running = false;

    private Logger logger = LoggerUtils.createLoggerFor(getClass().getName());

    RxWorker() {}

    @Override
    public void run() {

        running = true;

        while(running) {
            //logger.debug("run() called.");

            // Check for data
            byte[] rxData;
            try {
                rxData = serialPort.readBytes();
            } catch (SerialPortException e) {
                throw new RuntimeException(e);
            }

            // rxData will be null if there are no bytes in RX buffer
            // (this is jssc behaviour)
            if(rxData != null) {
                //logger.debug("Read " + rxData.length + " bytes of RX data.");

                for (Iterator<OnRxDataListener> it = onRxDataListeners.iterator(); it.hasNext(); ) {
                    OnRxDataListener onRxDataListener = it.next();
                    onRxDataListener.run(rxData);
                }
            }

            //logger.debug("Sleeping...");
            try {
                Thread.sleep(WAIT_TIME_BETWEEN_RX_READS_MS);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
        }
    }

    public void stopRunning() {
        running = false;
    }

}
