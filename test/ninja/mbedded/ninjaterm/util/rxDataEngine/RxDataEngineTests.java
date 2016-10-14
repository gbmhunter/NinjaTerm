package ninja.mbedded.ninjaterm.util.rxDataEngine;

import javafx.scene.paint.Color;
import ninja.mbedded.ninjaterm.util.streamedText.StreamedText;
import org.junit.Before;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

/**
 * Unit tests for the <code>copyCharsFrom()</code> method of <code>StreamedText</code> class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-27
 * @last-modified   2016-10-14
 */
public class RxDataEngineTests {

    private RxDataEngine rxDataEngine;

    private StreamedText output;

    @Before
    public void setUp() throws Exception {
        rxDataEngine = new RxDataEngine();

        rxDataEngine.newStreamedTextListeners.add(streamedText -> {
            output = streamedText;
        });
    }

    @Test
    public void oneCharTest() throws Exception {
        rxDataEngine.parse("a");
        assertEquals("a", output.getText());
    }

    @Test
    public void startOfEscapeSeqTest() throws Exception {
        rxDataEngine.parse("a\u001B");
        assertEquals("a", output.getText());
    }

    @Test
    public void asciiEscapeCodesOnTest() throws Exception {
        rxDataEngine.parse("123\u001B[30m456");
        assertEquals("123456", output.getText());
        assertEquals(1, output.getTextColours().size());
    }

    @Test
    public void asciiEscapeCodesOffTest() throws Exception {
        rxDataEngine.ansiECParser.isEnabled.set(false);
        rxDataEngine.parse("123\u001B[30m456");
        assertEquals("123\u001B[30m456", output.getText());
        assertEquals(0, output.getTextColours().size());
    }

    @Test
    public void filterTest() throws Exception {
        rxDataEngine.setFilterPattern("4");
        rxDataEngine.parse("123\n456\n789");
        assertEquals("456\n", output.getText());
        assertEquals(0, output.getTextColours().size());
    }
}