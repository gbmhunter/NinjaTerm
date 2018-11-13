package ninja.mbedded.ninjaterm.model.globalStats;

import javafx.animation.KeyFrame;
import javafx.animation.Timeline;
import javafx.beans.property.SimpleDoubleProperty;
import javafx.beans.property.SimpleIntegerProperty;
import javafx.event.ActionEvent;
import javafx.event.EventHandler;
import javafx.util.Duration;
import ninja.mbedded.ninjaterm.util.loggerUtils.LoggerUtils;
import org.slf4j.Logger;

import java.lang.management.ManagementFactory;

import com.sun.management.OperatingSystemMXBean;
/**
 * Model containing data and logic global statistics (not related to just one terminal).
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-16
 * @last-modified   2016-09-25
 */
public class GlobalStats {

    /**
     * The total number of characters send to all of the COM port.
     */
    public SimpleIntegerProperty numCharactersTx = new SimpleIntegerProperty(0);

    /**
     * The total number of characters received form all of the COM ports.
     */
    public SimpleIntegerProperty numCharactersRx = new SimpleIntegerProperty(0);

    /**
     * CPU load from the NinjaTerm process. Varies from 0.0 to 1.0.
     */
    public SimpleDoubleProperty processCpuLoad = new SimpleDoubleProperty(0.0);

    /**
     * Total CPU load from everything in the system (not just NinjaTerm). Varies from 0.0 to 1.0.
     */
    public SimpleDoubleProperty systemCpuLoad = new SimpleDoubleProperty(0.0);

    private Timeline measureCpuLoadTimer;

    public GlobalStats() {

        // Setup a JavaFX timeline as a timer to measure CPU load every second. If we used a standard Java timer,
        // we wouldn't be able to call JavaFX UI stuff from this
        measureCpuLoadTimer = new Timeline(new KeyFrame(Duration.seconds(1.0), new EventHandler<ActionEvent>() {
            @Override
            public void handle(ActionEvent event) {
                measureCpuLoad();
            }
        }));
        measureCpuLoadTimer.setCycleCount(Timeline.INDEFINITE);
        measureCpuLoadTimer.play();
    }

    private void measureCpuLoad() {
        OperatingSystemMXBean osBean = ManagementFactory.getPlatformMXBean(
                        OperatingSystemMXBean.class);
        // What % CPU load this current JVM is taking, from 0.0-1.0
        processCpuLoad.set(osBean.getProcessCpuLoad());

        // What % load the overall system is at, from 0.0-1.0
        systemCpuLoad.set(osBean.getSystemCpuLoad());

    }

}
