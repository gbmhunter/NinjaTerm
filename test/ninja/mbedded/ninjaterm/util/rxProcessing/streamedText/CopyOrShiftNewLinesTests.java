package ninja.mbedded.ninjaterm.util.rxProcessing.streamedText;

import ninja.mbedded.ninjaterm.JavaFXThreadingRule;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;

import java.lang.reflect.Method;

import static org.junit.Assert.assertEquals;

/**
 * Unit tests for the <code>{@link StreamedData}</code> class.
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

    private StreamedData inputStreamedData;
    private StreamedData outputStreamedData;

    private Method method;

    @Before
    public void setUp() throws Exception {
        inputStreamedData = new StreamedData();
        outputStreamedData = new StreamedData();

        // This makes a private method "public" for unit test purposes.
        method = StreamedData.class.getDeclaredMethod(
                "copyOrShiftNewLineMarkers",
                StreamedData.class, int.class, StreamedData.CopyOrShift.class);
        method.setAccessible(true);
    }

    @Test
    public void oneMarkerShiftTest() throws Exception {

        inputStreamedData.append("123456");
        inputStreamedData.addNewLineMarkerAt(2);

        method.invoke(outputStreamedData, inputStreamedData, inputStreamedData.getText().length(), StreamedData.CopyOrShift.SHIFT);

        // Check input
        assertEquals("123456", inputStreamedData.getText());
        assertEquals(0, inputStreamedData.getNewLineMarkers().size());

        // Check output
        assertEquals("", outputStreamedData.getText());
        assertEquals(1, outputStreamedData.getNewLineMarkers().size());
        assertEquals(2, outputStreamedData.getNewLineMarkers().get(0).intValue());
    }

    @Test
    public void twoMarkerShiftTest() throws Exception {

        inputStreamedData.append("123456");
        inputStreamedData.addNewLineMarkerAt(3);
        inputStreamedData.addNewLineMarkerAt(6);

        method.invoke(outputStreamedData, inputStreamedData, 3, StreamedData.CopyOrShift.SHIFT);

        // Check input
        assertEquals(1, inputStreamedData.getNewLineMarkers().size());
        assertEquals(3, inputStreamedData.getNewLineMarkers().get(0).intValue());

        // Check output
        assertEquals(1, outputStreamedData.getNewLineMarkers().size());
        assertEquals(3, outputStreamedData.getNewLineMarkers().get(0).intValue());
    }

    @Test
    public void twoMarkerCopyTest() throws Exception {

        inputStreamedData.append("123456");
        inputStreamedData.addNewLineMarkerAt(2);
        inputStreamedData.addNewLineMarkerAt(4);

        method.invoke(outputStreamedData, inputStreamedData, 3, StreamedData.CopyOrShift.COPY);

        // Check input
        assertEquals(2, inputStreamedData.getNewLineMarkers().size());
        assertEquals(2, inputStreamedData.getNewLineMarkers().get(0).intValue());
        assertEquals(4, inputStreamedData.getNewLineMarkers().get(1).intValue());

        // Check output
        assertEquals(1, outputStreamedData.getNewLineMarkers().size());
        assertEquals(2, outputStreamedData.getNewLineMarkers().get(0).intValue());
    }
}