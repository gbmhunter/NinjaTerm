package ninja.mbedded.ninjaterm.util.streamedText;

import javafx.scene.paint.Color;
import javafx.scene.text.Text;
import ninja.mbedded.ninjaterm.JavaFXThreadingRule;
import org.junit.Before;
import org.junit.Rule;
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

        assertEquals(false, StreamFilter.hasNewLineChar("abc"));
        assertEquals(true, StreamFilter.hasNewLineChar("abc\n"));
        assertEquals(true, StreamFilter.hasNewLineChar("abc\r\n"));
        assertEquals(false, StreamFilter.hasNewLineChar("abc\r"));
        assertEquals(true, StreamFilter.hasNewLineChar("a\nbc"));
    }

}