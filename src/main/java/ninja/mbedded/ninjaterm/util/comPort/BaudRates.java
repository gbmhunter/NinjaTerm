package ninja.mbedded.ninjaterm.util.comPort;

import java.util.ArrayList;
import java.util.List;

/**
 * Enumerates most of the popular baud rates. These will be shown by default
 * in the baud rate selection combobox.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-07-16
 * @last-modified   2016-07-17
 */
//public enum BaudRates {
//
//    BAUD_110("110"),
//    BAUD_300("300"),
//    BAUD_600("600"),
//    BAUD_1200("1200"),
//    BAUD_2400("2400"),
//    BAUD_4800("4800"),
//    BAUD_9600("9600"),
//    BAUD_14400("14400"),
//    BAUD_19200("19200"),
//    BAUD_38400("38400"),
//    BAUD_57600("57600"),
//    BAUD_115200("115200"),
//    BAUD_128000("128000"),
//    BAUD_256000("256000"),
//    ;
//
//    private String label;
//
//    BaudRates(String label) {
//        this.label = label;
//    }
//
//    @Override
//    public String toString() {
//        return label;
//    }
//
//}

public class BaudRates {

    public static final List<Integer> baudRates = new ArrayList<Integer>() {{
        add(300);
        add(600);
        add(1200);
        add(2400);
        add(4800);
        add(9600);
        add(14400);
        add(19200);
        add(38400);
        add(57600);
        add(115200);
        add(128000);
        add(256000);
    }};
}