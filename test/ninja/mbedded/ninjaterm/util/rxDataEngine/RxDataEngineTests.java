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
        rxDataEngine.setAnsiECEnabled(false);
        rxDataEngine.parse("123\u001B[30m456");
        assertEquals("123\u001B[30m456", output.getText());
        assertEquals(0, output.getTextColours().size());
    }

    @Test
    public void filterTest() throws Exception {
        rxDataEngine.setNewLinePattern("\n");
        rxDataEngine.setFilterPattern("4");

        rxDataEngine.parse("123\n456\n789");
        assertEquals("456\n", output.getText());
        assertEquals(0, output.getTextColours().size());
    }

    @Test
    public void resetFilterTest() throws Exception {
        rxDataEngine.setNewLinePattern("\n");
        rxDataEngine.setFilterPattern("1");

        rxDataEngine.parse("123\n456\n789");

        assertEquals("123\n", output.getText());
        assertEquals(0, output.getTextColours().size());

        rxDataEngine.setFilterPattern("4");
        rxDataEngine.rerunFilterOnExistingData();
        assertEquals("456\n", output.getText());
        assertEquals(0, output.getTextColours().size());
    }

    @Test
    public void basicColoursAndNewLineTest() throws Exception {
        rxDataEngine.setNewLinePattern("\r\n");
        rxDataEngine.setFilterPattern("");
        rxDataEngine.parse("123\u001B[30m4\r\n56");

        assertEquals("1234\r\n56", output.getText());

        assertEquals(1, output.getTextColours().size());
        assertEquals(3, output.getTextColours().get(0).position);
        assertEquals(Color.rgb(0, 0, 0), output.getTextColours().get(0).color);

        assertEquals(1, output.getNewLineMarkers().size());
        assertEquals(6, output.getNewLineMarkers().get(0).intValue());
    }

    @Test
    public void basicColoursNewLineFilterTest() throws Exception {
        rxDataEngine.setNewLinePattern("EOL");
        rxDataEngine.setFilterPattern("56");
        rxDataEngine.parse("123EOL\u001B[30m45");

        // Check there is nothing in the output
        assertEquals("", output.getText());
        assertEquals(0, output.getTextColours().size());
        assertEquals(0, output.getNewLineMarkers().size());

        // After receiving this data, we should now have some output
        rxDataEngine.parse("6EOL789");

        assertEquals("456EOL", output.getText());

        assertEquals(1, output.getTextColours().size());
        assertEquals(0, output.getTextColours().get(0).position);
        assertEquals(Color.rgb(0, 0, 0), output.getTextColours().get(0).color);

        assertEquals(1, output.getNewLineMarkers().size());
        assertEquals(6, output.getNewLineMarkers().get(0).intValue());
    }
}