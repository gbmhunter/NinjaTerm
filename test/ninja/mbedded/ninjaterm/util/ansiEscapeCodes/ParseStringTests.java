package ninja.mbedded.ninjaterm.util.ansiEscapeCodes;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.collections.transformation.SortedList;
import javafx.scene.Node;
import javafx.scene.text.Text;
import ninja.mbedded.ninjaterm.util.stringFilter.StringFilter;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

/**
 * Unit tests for the Processor class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-26
 * @last-modified   2016-09-26
 */
public class ParseStringTests {

    @Rule
    public JavaFXThreadingRule javafxRule = new JavaFXThreadingRule();

    @Before
    public void setUp() throws Exception {

    }

    @Test
    public void basicTest() throws Exception {
        Processor processor = new Processor();

        ObservableList<Node> observableList = FXCollections.observableArrayList();

        Text text = new Text();
        observableList.add(text);

        processor.parseString(observableList, "testing");

        assertEquals("testing", text.getText());
    }

}