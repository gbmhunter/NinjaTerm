package ninja.mbedded.ninjaterm.model.terminal.txRx;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.scene.Node;
import javafx.scene.paint.Color;
import javafx.scene.text.Text;
import ninja.mbedded.ninjaterm.JavaFXThreadingRule;
import ninja.mbedded.ninjaterm.util.ansiECParser.AnsiECParser;
import ninja.mbedded.ninjaterm.util.streamingFilter.StreamingFilter;
import ninja.mbedded.ninjaterm.util.streamedText.StreamedText;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

/**
 * Unit tests for the <code>TextNodeInList</code> class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-27
 * @last-modified   2016-10-02
 */
public class TxRxTests {

    /**
     * Including this variable in class allows JavaFX objects to be created in tests.
     */
    @Rule
    public JavaFXThreadingRule javafxRule = new JavaFXThreadingRule();

    private AnsiECParser ansiECParser;
    private StreamedText ansiECParserOutput;

    private StreamingFilter streamingFilter;
    private StreamedText streamFilterOutput;

    private ObservableList<Node> textNodes;

    @Before
    public void setUp() throws Exception {
        ansiECParser = new AnsiECParser();
        ansiECParserOutput = new StreamedText();

        streamingFilter = new StreamingFilter();
        streamingFilter.setFilterPatten("a");

        streamFilterOutput = new StreamedText();

        textNodes = FXCollections.observableArrayList();
        Text text = new Text();
        text.setFill(Color.BLACK);
        textNodes.add(text);
    }

    private void runOneIteration(String inputData) {
        ansiECParser.parse(inputData, ansiECParserOutput);
        streamingFilter.parse(ansiECParserOutput, streamFilterOutput);
        streamFilterOutput.shiftToTextNodes(textNodes);
    }

    @Test
    public void extractAppendTextTest() throws Exception {

        runOneIteration("\u001B");
        assertEquals(1, textNodes.size());
        assertEquals("", ((Text)textNodes.get(0)).getText());
        assertEquals(Color.BLACK, ((Text)textNodes.get(0)).getFill());

        runOneIteration("[");
        assertEquals(1, textNodes.size());
        assertEquals("", ((Text)textNodes.get(0)).getText());
        assertEquals(Color.BLACK, ((Text)textNodes.get(0)).getFill());

        runOneIteration("3");
        assertEquals(1, textNodes.size());
        assertEquals("", ((Text)textNodes.get(0)).getText());
        assertEquals(Color.BLACK, ((Text)textNodes.get(0)).getFill());

        runOneIteration("1");
        assertEquals(1, textNodes.size());
        assertEquals("", ((Text)textNodes.get(0)).getText());
        assertEquals(Color.BLACK, ((Text)textNodes.get(0)).getFill());

        runOneIteration("m");
        assertEquals(1, textNodes.size());
        assertEquals("", ((Text)textNodes.get(0)).getText());
        assertEquals(Color.BLACK, ((Text)textNodes.get(0)).getFill());

        // This will make a match
        runOneIteration("a");
        assertEquals(2, textNodes.size());
        assertEquals("", ((Text)textNodes.get(0)).getText());
        assertEquals(Color.BLACK, ((Text)textNodes.get(0)).getFill());
        assertEquals("a", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("b");
        assertEquals(2, textNodes.size());
        assertEquals("ab", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("\r");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("\n");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("c");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("d");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("\r");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("\n");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("\u001B");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("[");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("3");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("2");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("m");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("e");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("f");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("\r");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("\n");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("\u001B");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("[");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("3");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("2");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("m");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("\u001B");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("[");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("3");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("2");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("m");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("b");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("\r");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("\n");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("\u001B");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("[");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("3");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("2");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("m");
        assertEquals(2, textNodes.size());
        assertEquals("ab\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("a");
        assertEquals(3, textNodes.size());
        assertEquals("a", ((Text)textNodes.get(2)).getText());
        assertEquals(Color.rgb(0, 170, 0), ((Text)textNodes.get(2)).getFill());
    }

    @Test
    public void partialTest() throws Exception {
        runOneIteration("12\u001B[31");
        assertEquals(1, textNodes.size());
        assertEquals("", ((Text)textNodes.get(0)).getText());
        assertEquals(Color.BLACK, ((Text)textNodes.get(0)).getFill());

        runOneIteration("mabc\r");
        assertEquals(2, textNodes.size());
        assertEquals("12", ((Text)textNodes.get(0)).getText());
        assertEquals(Color.rgb(0, 0, 0), ((Text)textNodes.get(0)).getFill());
        assertEquals("abc\r", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());

        runOneIteration("\ndef");
        assertEquals(2, textNodes.size());
        assertEquals("abc\r\n", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.rgb(170, 0, 0), ((Text)textNodes.get(1)).getFill());
    }

    @Test
    public void emptyNewLineTest() throws Exception {
        runOneIteration("\n\na\n");
        assertEquals(1, textNodes.size());
        assertEquals("a\n", ((Text)textNodes.get(0)).getText());
        assertEquals(Color.BLACK, ((Text)textNodes.get(0)).getFill());

        runOneIteration("\n\n");
        assertEquals(1, textNodes.size());
        assertEquals("a\n", ((Text)textNodes.get(0)).getText());
        assertEquals(Color.BLACK, ((Text)textNodes.get(0)).getFill());
    }

}