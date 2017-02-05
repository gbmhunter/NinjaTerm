package ninja.mbedded.ninjaterm.util.loggerUtils;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.encoder.PatternLayoutEncoder;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.ConsoleAppender;
import ch.qos.logback.core.FileAppender;
import javafx.beans.property.SimpleBooleanProperty;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;

public class LoggerUtils {

    private static ConsoleAppender consoleAppender;
    private static FileAppender<ILoggingEvent> fileAppender;

    /**
     * Controls whether console logging is enabled or disabled.
     */
    public static SimpleBooleanProperty consoleLoggingEnabled;

    /**
     * Controls whether file logging is enabled or disabled.
     */
    public static SimpleBooleanProperty fileLoggingEnabled;

    static {
        LoggerContext loggerContext = (LoggerContext) LoggerFactory.getILoggerFactory();

        //==============================================//
        //============ PATTERN LAYOUT SETUP ============//
        //==============================================//
        PatternLayoutEncoder patternLayoutEncoder = new PatternLayoutEncoder();

        patternLayoutEncoder.setPattern("%date %level [%thread] %logger{10} [%file:%line] %msg%n");
        patternLayoutEncoder.setContext(loggerContext);
        patternLayoutEncoder.start();

        //==============================================//
        //=========== CONSOLE APPENDER SETUP ===========//
        //==============================================//

        // CONSOLE APPENDER
        consoleAppender = new ConsoleAppender<>();
        consoleAppender.setContext(loggerContext);
        consoleAppender.setEncoder(patternLayoutEncoder);
        consoleAppender.setName("stdout");
        consoleAppender.setTarget("System.out");
        consoleAppender.start();

        /*Logger rootLogger = (Logger) LoggerFactory.getLogger(Logger.ROOT_LOGGER_NAME);
        rootLogger.addAppender(consoleAppender);
        rootLogger.setLevel(Level.WARN);*/

        consoleLoggingEnabled = new SimpleBooleanProperty(false);
        consoleLoggingEnabled.addListener((observable, oldValue, newValue) -> {
            handleConsoleLoggingEnabledChanged();
        });
        // Update to default state
        handleConsoleLoggingEnabledChanged();


        //==============================================//
        //============= FILE APPENDER SETUP ============//
        //==============================================//

        // FILE APPENDER
        fileAppender = new FileAppender<ILoggingEvent>();
        String userHomeDir = System.getProperty("user.home");
        // Build up a string of the current date/time (incl. milli-seconds)
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd-HH-mm-ss");
        Date date = new Date();
        String dateString = sdf.format(date);
        String defaultDebugLogFilePath = userHomeDir + File.separator + "NinjaTerm-" + dateString + "-DEBUG.log";
        fileAppender.setFile(defaultDebugLogFilePath);
        fileAppender.setEncoder(patternLayoutEncoder);
        fileAppender.setContext(loggerContext);

        fileLoggingEnabled = new SimpleBooleanProperty(false);
        fileLoggingEnabled.addListener((observable, oldValue, newValue) -> {
            handleFileLoggingEnabledChanged();
        });
        // Update to default state
        handleFileLoggingEnabledChanged();

    }

    private static void handleConsoleLoggingEnabledChanged() {
        if(consoleLoggingEnabled.get())
            consoleAppender.start();
        else
            consoleAppender.stop();
    }

    private static void handleFileLoggingEnabledChanged() {
        if(fileLoggingEnabled.get())
            fileAppender.start();
        else
            fileAppender.stop();
    }

    /**
     * Creates a logger which already has a file appender attached to it.
     * The file appender is not started until <code>startDebuggingToFile()</code>
     * is called.
     *
     * @param string
     * @return
     */
    public static Logger createLoggerFor(String string) {

        Logger logger = (Logger) LoggerFactory.getLogger(string);

        logger.addAppender(consoleAppender);
        logger.addAppender(fileAppender);

//        logger.setLevel(Level.DEBUG);
//        logger.setAdditive(false); /* set to true if root should log too */

        return logger;
    }

}
