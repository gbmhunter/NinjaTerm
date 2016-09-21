package ninja.mbedded.ninjaterm.util.stringFilter;

import ninja.mbedded.ninjaterm.util.comport.ComPort;
import org.junit.Before;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

/**
 * Unit tests for the StringFilter class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-21
 * @last-modified   2016-09-21
 */
public class StringFilterTest {
    @Before
    public void setUp() throws Exception {

    }

    @Test
    public void basicTest() throws Exception {

        String filterResult = StringFilter.filterByLine("A\rB\rC\r", "B");

        assertEquals("B\r", filterResult);

    }

}