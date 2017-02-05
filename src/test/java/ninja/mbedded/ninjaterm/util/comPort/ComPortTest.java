package ninja.mbedded.ninjaterm.util.comPort;

import org.junit.Before;
import org.junit.Test;

import static org.junit.Assert.*;

/**
 * Unit tests for the ComPort class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-07-17
 * @last-modified   2016-07-17
 */
public class ComPortTest {
    @Before
    public void setUp() throws Exception {

    }

    @Test
    public void constructorTest() throws Exception {

        ComPort comPort = new ComPort();

        comPort.setName("COM1");

        assertEquals("COM1", comPort.getName());

    }

}