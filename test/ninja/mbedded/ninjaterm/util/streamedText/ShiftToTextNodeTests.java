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
 * Unit tests for the <code>shiftToTextNodes()</code> method of the <code>{@link StreamedText}</code> class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-10-02
 * @last-modified   2016-10-06
 */
public class ShiftToTextNodeTests {

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

        streamedText.shiftToTextNodes(textNodes, textNodes.size());

        assertEquals(1, textNodes.size());
        assertEquals("1234", ((Text)textNodes.get(0)).getText());
        assertEquals(Color.RED, ((Text)textNodes.get(0)).getFill());
    }

    @Test
    public void colorTest() throws Exception {

        streamedText.append("1234");
        streamedText.addColour(2, Color.GREEN);

        streamedText.shiftToTextNodes(textNodes, textNodes.size());

        assertEquals(2, textNodes.size());

        assertEquals("12", ((Text)textNodes.get(0)).getText());
        assertEquals(Color.RED, ((Text)textNodes.get(0)).getFill());

        assertEquals("34", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.GREEN, ((Text)textNodes.get(1)).getFill());
    }

    @Test
    public void addColorToNextNodeTest() throws Exception {

        streamedText.append("123456");
        streamedText.addColour(2, Color.GREEN);
        streamedText.addColour(3, Color.RED);
        streamedText.addColour(5, Color.BLUE);

        streamedText.shiftToTextNodes(textNodes, textNodes.size());

        assertEquals(4, textNodes.size());

        assertEquals("12", ((Text)textNodes.get(0)).getText());
        assertEquals(Color.RED, ((Text)textNodes.get(0)).getFill());
        assertEquals("3", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.GREEN, ((Text)textNodes.get(1)).getFill());
        assertEquals("45", ((Text)textNodes.get(2)).getText());
        assertEquals(Color.RED, ((Text)textNodes.get(2)).getFill());
        assertEquals("6", ((Text)textNodes.get(3)).getText());
        assertEquals(Color.BLUE, ((Text)textNodes.get(3)).getFill());
    }

    @Test
    public void colourToBeInsertedOnNextCharTest() throws Exception {

        streamedText.setColorToBeInsertedOnNextChar(Color.GREEN);

        streamedText.shiftToTextNodes(textNodes, textNodes.size());

        assertEquals(null, streamedText.getColorToBeInsertedOnNextChar());

        assertEquals(2, textNodes.size());

        assertEquals("", ((Text)textNodes.get(0)).getText());
        assertEquals(Color.RED, ((Text)textNodes.get(0)).getFill());
        assertEquals("", ((Text)textNodes.get(1)).getText());
        assertEquals(Color.GREEN, ((Text)textNodes.get(1)).getFill());
    }

}