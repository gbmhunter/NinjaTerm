package ninja.mbedded.ninjaterm.util.loggerUtils;

import org.slf4j.LoggerFactory;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.encoder.PatternLayoutEncoder;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.FileAppender;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;

public class LoggerUtils {

    private static FileAppender<ILoggingEvent> fileAppender;

    static {
        LoggerContext lc = (LoggerContext) LoggerFactory.getILoggerFactory();
        PatternLayoutEncoder ple = new PatternLayoutEncoder();

        ple.setPattern("%date %level [%thread] %logger{10} [%file:%line] %msg%n");
        ple.setContext(lc);
        ple.start();
        fileAppender = new FileAppender<ILoggingEvent>();

        String userHomeDir = System.getProperty("user.home");

        // Build up a string of the current date/time (incl. milli-seconds)
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd-HH-mm-ss");
        Date date = new Date();
        String dateString = sdf.format(date);

        String defaultDebugLogFilePath = userHomeDir + File.separator + "NinjaTerm-" + dateString + "-DEBUG.log";

        fileAppender.setFile(defaultDebugLogFilePath);
        fileAppender.setEncoder(ple);
        fileAppender.setContext(lc);
        //fileAppender.start();
    }

    public static void addDebug() {
        fileAppender.start();
    }

    public static Logger createLoggerFor(String string) {

        Logger logger = (Logger) LoggerFactory.getLogger(string);
        logger.addAppender(fileAppender);
        logger.setLevel(Level.DEBUG);
        logger.setAdditive(false); /* set to true if root should log too */

        return logger;
    }

}
