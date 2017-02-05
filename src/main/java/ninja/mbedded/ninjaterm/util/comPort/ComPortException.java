package ninja.mbedded.ninjaterm.util.comPort;

/**
 * Created by gbmhu on 2016-08-23.
 */
public class ComPortException extends Exception  {

    public enum ExceptionType {
        COM_PORT_BUSY,
        COM_PORT_DOES_NOT_EXIST,
    }

    public ExceptionType type;


    public ComPortException() { super(); }
    public ComPortException(String message) { super(message); }
    public ComPortException(String message, Throwable cause) { super(message, cause); }
    public ComPortException(Throwable cause) { super(cause); }
    public ComPortException(ExceptionType type) {
        this.type = type;
    }
}

