package ninja.mbedded.ninjaterm.util.streamedText;

import ninja.mbedded.ninjaterm.JavaFXThreadingRule;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;

import java.lang.reflect.Method;

import static org.junit.Assert.assertEquals;

/**
 * Unit tests for the <code>{@link StreamedText}</code> class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-10-15
 * @last-modified   2016-10-16
 */
public class CopyOrShiftNewLinesTests {

    /**
     * Including this variable in class allows JavaFX objects to be created in tests.
     */
    @Rule
    public JavaFXThreadingRule javafxRule = new JavaFXThreadingRule();

    private StreamedText inputStreamedText;
    private StreamedText outputStreamedText;

    private Method method;

    @Before
    public void setUp() throws Exception {
        inputStreamedText = new StreamedText();
        outputStreamedText = new StreamedText();

        // This makes a private method "public" for unit test purposes.
        method = StreamedText.class.getDeclaredMethod(
                "copyOrShiftNewLineMarkers",
                StreamedText.class, int.class, StreamedText.CopyOrShift.class);
        method.setAccessible(true);
    }

    @Test
    public void oneMarkerShiftTest() throws Exception {

        inputStreamedText.append("123456");
        inputStreamedText.addNewLineMarkerAt(2);

        method.invoke(outputStreamedText, inputStreamedText, inputStreamedText.getText().length(), StreamedText.CopyOrShift.SHIFT);

        // Check input
        assertEquals("123456", inputStreamedText.getText());
        assertEquals(0, inputStreamedText.getNewLineMarkers().size());

        // Check output
        assertEquals("", outputStreamedText.getText());
        assertEquals(1, outputStreamedText.getNewLineMarkers().size());
        assertEquals(2, outputStreamedText.getNewLineMarkers().get(0).intValue());
    }

    @Test
    public void twoMarkerShiftTest() throws Exception {

        inputStreamedText.append("123456");
        inputStreamedText.addNewLineMarkerAt(3);
        inputStreamedText.addNewLineMarkerAt(6);

        method.invoke(outputStreamedText, inputStreamedText, 3, StreamedText.CopyOrShift.SHIFT);

        // Check input
        assertEquals(1, inputStreamedText.getNewLineMarkers().size());
        assertEquals(3, inputStreamedText.getNewLineMarkers().get(0).intValue());

        // Check output
        assertEquals(1, outputStreamedText.getNewLineMarkers().size());
        assertEquals(3, outputStreamedText.getNewLineMarkers().get(0).intValue());
    }

    @Test
    public void twoMarkerCopyTest() throws Exception {

        inputStreamedText.append("123456");
        inputStreamedText.addNewLineMarkerAt(2);
        inputStreamedText.addNewLineMarkerAt(4);

        method.invoke(outputStreamedText, inputStreamedText, 3, StreamedText.CopyOrShift.COPY);

        // Check input
        assertEquals(2, inputStreamedText.getNewLineMarkers().size());
        assertEquals(2, inputStreamedText.getNewLineMarkers().get(0).intValue());
        assertEquals(4, inputStreamedText.getNewLineMarkers().get(1).intValue());

        // Check output
        assertEquals(1, outputStreamedText.getNewLineMarkers().size());
        assertEquals(2, outputStreamedText.getNewLineMarkers().get(0).intValue());
    }
}