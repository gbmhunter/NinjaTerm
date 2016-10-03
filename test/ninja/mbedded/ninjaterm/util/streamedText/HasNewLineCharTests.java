package ninja.mbedded.ninjaterm.util.streamedText;

import ninja.mbedded.ninjaterm.util.streamingFilter.StreamingFilter;
import org.junit.Before;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

/**
 * Unit tests for the <code>hasNewLineChar()</code> method.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-30
 * @last-modified   2016-09-30
 */
public class HasNewLineCharTests {

    @Before
    public void setUp() throws Exception {

    }

    @Test
    public void basicTest() throws Exception {

        assertEquals(false, StreamingFilter.hasNewLineChar("abc"));
        assertEquals(true, StreamingFilter.hasNewLineChar("abc\n"));
        assertEquals(true, StreamingFilter.hasNewLineChar("abc\r\n"));
        assertEquals(false, StreamingFilter.hasNewLineChar("abc\r"));
        assertEquals(true, StreamingFilter.hasNewLineChar("a\nbc"));
    }

}