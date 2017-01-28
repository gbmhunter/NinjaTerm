package ninja.mbedded.ninjaterm.util.textNodeInList;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.scene.Node;
import javafx.scene.text.Text;
import ninja.mbedded.ninjaterm.JavaFXThreadingRule;
import ninja.mbedded.ninjaterm.util.mutable.MutableInteger;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

/**
 * Unit tests for the <code>TextNodeInList</code> class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-27
 * @last-modified   2016-09-27
 */
public class TextInListUtilsTests {

    private MutableInteger numNewLinesRemoved;

    /**
     * Including this variable in class allows JavaFX objects to be created in tests.
     */
    @Rule
    public JavaFXThreadingRule javafxRule = new JavaFXThreadingRule();

    @Before
    public void setUp() throws Exception {
        numNewLinesRemoved = new MutableInteger(0);
    }

    @Test
    public void oneNodeTest() throws Exception {

        ObservableList<Node> observableList = FXCollections.observableArrayList();
        observableList.add(new Text("1234"));

        TextNodeInList.trimTextNodesFromStart(observableList, 1, numNewLinesRemoved);
        assertEquals("234", ((Text)observableList.get(0)).getText());
        assertEquals(0, numNewLinesRemoved.intValue());
    }

    @Test
    public void twoNodeSmallTrimTest() throws Exception {

        ObservableList<Node> observableList = FXCollections.observableArrayList();
        observableList.add(new Text("1234"));
        observableList.add(new Text("5678"));

        TextNodeInList.trimTextNodesFromStart(observableList, 1, numNewLinesRemoved);
        assertEquals(2, observableList.size());
        assertEquals("234", ((Text)observableList.get(0)).getText());
        assertEquals("5678", ((Text)observableList.get(1)).getText());
        assertEquals(0, numNewLinesRemoved.intValue());
    }

    @Test
    public void twoNodeLargeTrimTest() throws Exception {

        ObservableList<Node> observableList = FXCollections.observableArrayList();
        observableList.add(new Text("1234"));
        observableList.add(new Text("5678"));

        TextNodeInList.trimTextNodesFromStart(observableList, 5, numNewLinesRemoved);
        assertEquals(1, observableList.size());
        assertEquals("678", ((Text)observableList.get(0)).getText());
        assertEquals(0, numNewLinesRemoved.intValue());
    }

    @Test
    public void removeAllCharsTest() throws Exception {

        ObservableList<Node> observableList = FXCollections.observableArrayList();
        observableList.add(new Text("1234"));
        observableList.add(new Text("5678"));

        TextNodeInList.trimTextNodesFromStart(observableList, 8, numNewLinesRemoved);

        // Note that by design, one empty TextNode is left
        assertEquals(1, observableList.size());
        assertEquals(0, numNewLinesRemoved.intValue());
    }

    @Test
    public void simpleNewLineTest() throws Exception {

        ObservableList<Node> observableList = FXCollections.observableArrayList();
        observableList.add(new Text("123\n456"));

        TextNodeInList.trimTextNodesFromStart(observableList, 4, numNewLinesRemoved);

        // Note that by design, one empty TextNode is left
        assertEquals(1, observableList.size());
        assertEquals("456", ((Text)observableList.get(0)).getText());
        assertEquals(1, numNewLinesRemoved.intValue());
    }

    @Test
    public void multipleNewLinesTest() throws Exception {

        ObservableList<Node> observableList = FXCollections.observableArrayList();
        observableList.add(new Text("123\n456\n"));

        TextNodeInList.trimTextNodesFromStart(observableList, 4, numNewLinesRemoved);

        // Note that by design, one empty TextNode is left
        assertEquals(1, observableList.size());
        assertEquals("456\n", ((Text)observableList.get(0)).getText());
        assertEquals(1, numNewLinesRemoved.intValue());
    }

    @Test
    public void multipleNodesMultipleNewLinesTest() throws Exception {

        ObservableList<Node> observableList = FXCollections.observableArrayList();
        observableList.add(new Text("123\n"));
        observableList.add(new Text("456\n"));
        observableList.add(new Text("789\n"));

        TextNodeInList.trimTextNodesFromStart(observableList, 9, numNewLinesRemoved);

        // Note that by design, one empty TextNode is left
        assertEquals(1, observableList.size());
        assertEquals("89\n", ((Text)observableList.get(0)).getText());
        assertEquals(2, numNewLinesRemoved.intValue());
    }

}