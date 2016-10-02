package ninja.mbedded.ninjaterm.util.streamedText;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.scene.Node;
import javafx.scene.paint.Color;
import javafx.scene.text.Text;
import ninja.mbedded.ninjaterm.JavaFXThreadingRule;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

/**
 * Unit tests for the <code>TextInListUtils</code> class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-10-02
 * @last-modified   2016-10-02
 */
public class StreamedTextAddToTextNodeTests {

    /**
     * Including this variable in class allows JavaFX objects to be created in tests.
     */
    @Rule
    public JavaFXThreadingRule javafxRule = new JavaFXThreadingRule();

    private StreamedText streamedText;
    private ObservableList<Node> textNodes;

    @Before
    public void setUp() throws Exception {
        streamedText = new StreamedText();
        textNodes = FXCollections.observableArrayList();

        Text text = new Text();
        text.setFill(Color.RED);
        textNodes.add(text);
    }

    @Test
    public void basicTest() throws Exception {

        streamedText.append("1234");

        streamedText.shiftToTextNodes(textNodes);

        assertEquals(1, textNodes.size());
        assertEquals("1234", ((Text)textNodes.get(0)).getText());
        assertEquals(Color.RED, ((Text)textNodes.get(0)).getFill());
    }

    @Test
    public void colorTest() throws Exception {

        streamedText.append("1234");
        streamedText.addColour(2, Color.GREEN);

        streamedText.shiftToTextNodes(textNodes);

        assertEquals(2, textNodes.size());

        assertEquals("12", ((Text)textNodes.get(0)).getText());
        assertEquals(Color.RED, ((Text)textNodes.get(0)).getFill());

        assertEquals("34", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.GREEN, ((Text)textNodes.get(1)).getFill());
    }

    @Test
    public void addColorToNextNodeTest() throws Exception {

        streamedText.setColorToBeInsertedOnNextChar(Color.GREEN);

        streamedText.shiftToTextNodes(textNodes);

        assertEquals(null, streamedText.getColorToBeInsertedOnNextChar());

        assertEquals(2, textNodes.size());

        assertEquals("", ((Text)textNodes.get(0)).getText());
        assertEquals(Color.RED, ((Text)textNodes.get(0)).getFill());
        assertEquals("", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.GREEN, ((Text)textNodes.get(1)).getFill());
    }

}