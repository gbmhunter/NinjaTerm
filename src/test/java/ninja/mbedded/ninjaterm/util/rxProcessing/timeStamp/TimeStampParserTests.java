package ninja.mbedded.ninjaterm.util.rxProcessing.timeStamp;

import javafx.scene.paint.Color;
import ninja.mbedded.ninjaterm.JavaFXThreadingRule;
import ninja.mbedded.ninjaterm.util.rxProcessing.streamedData.StreamedData;
import ninja.mbedded.ninjaterm.util.rxProcessing.streamingFilter.StreamingFilter;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;

import java.time.Instant;
import java.time.ZoneId;

import static org.junit.Assert.assertEquals;

/**
 * Unit tests for the {@link TimeStampParser} class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-11-23
 * @last-modified   2016-11-23
 */
public class TimeStampParserTests {

    /**
     * Including this variable in class allows JavaFX objects to be created in tests.
     */
    @Rule
    public JavaFXThreadingRule javafxRule = new JavaFXThreadingRule();

    private TimeStampParser timeStampParser;

    private StreamedData inputStreamedData;
    private StreamedData outputStreamedData;

    @Before
    public void setUp() throws Exception {
        timeStampParser = new TimeStampParser("EOL");

        inputStreamedData = new StreamedData();
        outputStreamedData = new StreamedData();
    }

    @Test
    public void firstCharTest() throws Exception {

        inputStreamedData.append("abc");

        timeStampParser.parse(inputStreamedData, outputStreamedData);

        // Check input
        assertEquals("", inputStreamedData.getText());

        // Check output
        assertEquals("abc", outputStreamedData.getText());
        assertEquals(1, outputStreamedData.getTimeStampMarkers().size());
        assertEquals(0, outputStreamedData.getTimeStampMarkers().get(0).charPos);
    }

    @Test
    public void oneNewLineTest() throws Exception {

        inputStreamedData.append("abcEOLd");

        timeStampParser.parse(inputStreamedData, outputStreamedData);

        // Check input
        assertEquals("", inputStreamedData.getText());

        // Check output
        assertEquals("abcEOLd", outputStreamedData.getText());
        assertEquals(2, outputStreamedData.getTimeStampMarkers().size());
        assertEquals(0, outputStreamedData.getTimeStampMarkers().get(0).charPos);
        assertEquals(6, outputStreamedData.getTimeStampMarkers().get(1).charPos);
    }

    @Test
    public void temporalTest() throws Exception {

        inputStreamedData.append("abcEOL");

        timeStampParser.parse(inputStreamedData, outputStreamedData);

        // Check input
        assertEquals("", inputStreamedData.getText());

        // Check output
        assertEquals("abcEOL", outputStreamedData.getText());
        assertEquals(1, outputStreamedData.getTimeStampMarkers().size());
        assertEquals(0, outputStreamedData.getTimeStampMarkers().get(0).charPos);

        // Sleep enough that the next TimeStamp is guaranteed to be greater than
        // the first (delay must be larger than the min. LocalDateTime resolution)
        Thread.sleep(10);

        //==============================================//
        //====================== RUN 2 =================//
        //==============================================//

        inputStreamedData.append("d");

        timeStampParser.parse(inputStreamedData, outputStreamedData);

        // Check input
        assertEquals("", inputStreamedData.getText());

        // Check output
        assertEquals("abcEOLd", outputStreamedData.getText());
        assertEquals(2, outputStreamedData.getTimeStampMarkers().size());
        assertEquals(0, outputStreamedData.getTimeStampMarkers().get(0).charPos);
        assertEquals(6, outputStreamedData.getTimeStampMarkers().get(1).charPos);

        // Check time
        Instant time0 = outputStreamedData.getTimeStampMarkers().get(0).localDateTime.atZone(ZoneId.systemDefault()).toInstant();
        Instant time1 = outputStreamedData.getTimeStampMarkers().get(1).localDateTime.atZone(ZoneId.systemDefault()).toInstant();
        assertEquals(true, time1.isAfter(time0));

    }

    @Test
    public void partialLineTest() throws Exception {

        inputStreamedData.append("123EO");

        timeStampParser.parse(inputStreamedData, outputStreamedData);

        // Check input
        assertEquals("EO", inputStreamedData.getText());

        // Check output
        assertEquals("123", outputStreamedData.getText());
        assertEquals(1, outputStreamedData.getTimeStampMarkers().size());
        assertEquals(0, outputStreamedData.getTimeStampMarkers().get(0).charPos);

        inputStreamedData.append("L456");

        timeStampParser.parse(inputStreamedData, outputStreamedData);

        // Check input
        assertEquals("", inputStreamedData.getText());

        // Check output
        assertEquals("123EOL456", outputStreamedData.getText());
        assertEquals(2, outputStreamedData.getTimeStampMarkers().size());
        assertEquals(0, outputStreamedData.getTimeStampMarkers().get(0).charPos);
        assertEquals(6, outputStreamedData.getTimeStampMarkers().get(1).charPos);
    }

//    @Test
//    public void multipleLinesTest() throws Exception {
//
//        inputStreamedData.append("abcEOLabcEOLdefEOL");
//        inputStreamedData.addNewLineMarkerAt(6);
//        inputStreamedData.addNewLineMarkerAt(12);
//        inputStreamedData.addNewLineMarkerAt(18);
//
//        streamingFilter.parse(inputStreamedData, outputStreamedData);
//
//        // Check input. Since "defEOL" counts as a valid line, but has no match,
//        // it should be removed from the input
//        assertEquals("", inputStreamedData.getText());
//        assertEquals(0, inputStreamedData.getColourMarkers().size());
//
//        // Check output
//        assertEquals("abcEOLabcEOL", outputStreamedData.getText());
//        assertEquals(0, outputStreamedData.getColourMarkers().size());
//        assertEquals(2, outputStreamedData.getNewLineMarkers().size());
//        assertEquals(6, outputStreamedData.getNewLineMarkers().get(0).intValue());
//        assertEquals(12, outputStreamedData.getNewLineMarkers().get(1).intValue());
//    }
//
//    @Test
//    public void MatchedLinesBetweenNonMatchTest() throws Exception {
//
//        inputStreamedData.append("abcEOLdefEOLabcEOL");
//        inputStreamedData.addNewLineMarkerAt(6);
//        inputStreamedData.addNewLineMarkerAt(12);
//        inputStreamedData.addNewLineMarkerAt(18);
//
//        streamingFilter.parse(inputStreamedData, outputStreamedData);
//
//        // Check input. Since "defEOL" counts as a valid line, but has no match,
//        // it should be removed from the input
//        assertEquals("", inputStreamedData.getText());
//        assertEquals(0, inputStreamedData.getColourMarkers().size());
//
//        // Check output
//        assertEquals("abcEOLabcEOL", outputStreamedData.getText());
//        assertEquals(0, outputStreamedData.getColourMarkers().size());
//        assertEquals(2, outputStreamedData.getNewLineMarkers().size());
//        assertEquals(6, outputStreamedData.getNewLineMarkers().get(0).intValue());
//        assertEquals(12, outputStreamedData.getNewLineMarkers().get(1).intValue());
//    }
//
//    @Test
//    public void streamTest() throws Exception {
//
//        inputStreamedData.append("ab");
//
//        streamingFilter.parse(inputStreamedData, outputStreamedData);
//
//        assertEquals("", inputStreamedData.getText());
//        assertEquals("ab", outputStreamedData.getText());
//
//        inputStreamedData.append("cEOL");
//        inputStreamedData.addNewLineMarkerAt(4);
//
//        streamingFilter.parse(inputStreamedData, outputStreamedData);
//
//        assertEquals("", inputStreamedData.getText());
//        assertEquals(0, inputStreamedData.getNewLineMarkers().size());
//
//        // Check output
//        assertEquals("abcEOL", outputStreamedData.getText());
//        assertEquals(1, outputStreamedData.getNewLineMarkers().size());
//        assertEquals(6, outputStreamedData.getNewLineMarkers().get(0).intValue());
//    }
//
//    @Test
//    public void streamWithNonMatchLineInMiddleTest() throws Exception {
//
//        //==============================================//
//        //==================== PASS 1 ==================//
//        //==============================================//
//
//        inputStreamedData.append("ab");
//
//        streamingFilter.parse(inputStreamedData, outputStreamedData);
//
//        // Check input
//        assertEquals("", inputStreamedData.getText());
//
//        // Check output
//        assertEquals("ab", outputStreamedData.getText());
//
//        //==============================================//
//        //==================== PASS 2 ==================//
//        //==============================================//
//
//        inputStreamedData.append("cEOLde");
//        inputStreamedData.addNewLineMarkerAt(4);
//
//        streamingFilter.parse(inputStreamedData, outputStreamedData);
//
//        // Check input
//        assertEquals(inputStreamedData.getText(), "de");
//
//        // Check output
//        assertEquals("abcEOL", outputStreamedData.getText());
//        assertEquals(1, outputStreamedData.getNewLineMarkers().size());
//        assertEquals(6, outputStreamedData.getNewLineMarkers().get(0).intValue());
//
//        //==============================================//
//        //==================== PASS 3 ==================//
//        //==============================================//
//
//        inputStreamedData.append("fEOLa");
//        inputStreamedData.addNewLineMarkerAt(inputStreamedData.getText().length() - 1);
//
//        streamingFilter.parse(inputStreamedData, outputStreamedData);
//
//        // Check input
//        assertEquals(inputStreamedData.getText(), "");
//        assertEquals(0, inputStreamedData.getNewLineMarkers().size());
//
//        // Check output
//        assertEquals("abcEOLa", outputStreamedData.getText());
//        assertEquals(1, outputStreamedData.getNewLineMarkers().size());
//        assertEquals(6, outputStreamedData.getNewLineMarkers().get(0).intValue());
//
//        //==============================================//
//        //==================== PASS 4 ==================//
//        //==============================================//
//
//        inputStreamedData.append("bcEOL");
//        inputStreamedData.addNewLineMarkerAt(inputStreamedData.getText().length());
//
//        streamingFilter.parse(inputStreamedData, outputStreamedData);
//
//        // Check input
//        assertEquals(inputStreamedData.getText(), "");
//        assertEquals(0, inputStreamedData.getNewLineMarkers().size());
//
//        // Check output
//        assertEquals("abcEOLabcEOL", outputStreamedData.getText());
//        assertEquals(2, outputStreamedData.getNewLineMarkers().size());
//        assertEquals(6, outputStreamedData.getNewLineMarkers().get(0).intValue());
//        assertEquals(12, outputStreamedData.getNewLineMarkers().get(1).intValue());
//
//    }
//
//    @Test
//    public void coloursAndNewLinesTest() throws Exception {
//
//        inputStreamedData.append("abcEOL");
//        inputStreamedData.addColour(2, Color.RED);
//        inputStreamedData.addNewLineMarkerAt(6);
//
//        streamingFilter.parse(inputStreamedData, outputStreamedData);
//
//        // Check output
//        assertEquals("abcEOL", outputStreamedData.getText());
//        assertEquals(1, outputStreamedData.getColourMarkers().size());
//        assertEquals(2, outputStreamedData.getColourMarkers().get(0).position);
//        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(0).color);
//        assertEquals(1, outputStreamedData.getNewLineMarkers().size());
//        assertEquals(6, outputStreamedData.getNewLineMarkers().get(0).intValue());
//    }
//
//    @Test
//    public void complexNodesTest() throws Exception {
//
//        inputStreamedData.append("abcdefEOL");
//        inputStreamedData.addColour(2, Color.RED);
//        inputStreamedData.addColour(3, Color.GREEN);
//        inputStreamedData.addNewLineMarkerAt(9);
//
//        streamingFilter.parse(inputStreamedData, outputStreamedData);
//
//        assertEquals("abcdefEOL", outputStreamedData.getText());
//        assertEquals(2, outputStreamedData.getColourMarkers().size());
//
//        assertEquals(2, outputStreamedData.getColourMarkers().get(0).position);
//        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(0).color);
//
//        assertEquals(3, outputStreamedData.getColourMarkers().get(1).position);
//        assertEquals(Color.GREEN, outputStreamedData.getColourMarkers().get(1).color);
//
//        assertEquals(1, outputStreamedData.getNewLineMarkers().size());
//        assertEquals(9, outputStreamedData.getNewLineMarkers().get(0).intValue());
//    }
//
//    @Test
//    public void complexNodes2Test() throws Exception {
//
//        //==============================================//
//        //==================== PASS 1 ==================//
//        //==============================================//
//
//        inputStreamedData.append("abcEOL");
//        inputStreamedData.addColour(2, Color.RED);
//        inputStreamedData.addNewLineMarkerAt(6);
//
//        streamingFilter.parse(inputStreamedData, outputStreamedData);
//
//        assertEquals("abcEOL", outputStreamedData.getText());
//        assertEquals(1, outputStreamedData.getColourMarkers().size());
//        assertEquals(2, outputStreamedData.getColourMarkers().get(0).position);
//        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(0).color);
//        assertEquals(1, outputStreamedData.getNewLineMarkers().size());
//        assertEquals(6, outputStreamedData.getNewLineMarkers().get(0).intValue());
//
//        //==============================================//
//        //==================== PASS 2 ==================//
//        //==============================================//
//
//        inputStreamedData.append("defEOL");
//        inputStreamedData.addColour(0, Color.GREEN);
//        inputStreamedData.addNewLineMarkerAt(inputStreamedData.getText().length());
//
//        streamingFilter.parse(inputStreamedData, outputStreamedData);
//
//        assertEquals("abcEOL", outputStreamedData.getText());
//        assertEquals(1, outputStreamedData.getColourMarkers().size());
//        assertEquals(2, outputStreamedData.getColourMarkers().get(0).position);
//        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(0).color);
//        assertEquals(1, outputStreamedData.getNewLineMarkers().size());
//        assertEquals(6, outputStreamedData.getNewLineMarkers().get(0).intValue());
//    }
//
//    @Test
//    public void bigTest() throws Exception {
//
//        streamingFilter.setFilterPattern("d");
//
//        inputStreamedData.append("re");
//        inputStreamedData.addColour(0, Color.RED);
//
//        streamingFilter.parse(inputStreamedData, outputStreamedData);
//
//        assertEquals("", outputStreamedData.getText());
//        assertEquals(0, outputStreamedData.getColourMarkers().size());
//
//        inputStreamedData.append("dEOL");
//        inputStreamedData.addNewLineMarkerAt(inputStreamedData.getText().length());
//
//        streamingFilter.parse(inputStreamedData, outputStreamedData);
//
//        assertEquals("redEOL", outputStreamedData.getText());
//        assertEquals(1, outputStreamedData.getColourMarkers().size());
//        assertEquals(0, outputStreamedData.getColourMarkers().get(0).position);
//        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(0).color);
//
//        streamingFilter.parse(inputStreamedData, outputStreamedData);
//
//        // Nothing should of changed
//        assertEquals("redEOL", outputStreamedData.getText());
//        assertEquals(1, outputStreamedData.getColourMarkers().size());
//        assertEquals(0, outputStreamedData.getColourMarkers().get(0).position);
//        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(0).color);
//
//        inputStreamedData.append("greenEOL");
//        inputStreamedData.addColour(inputStreamedData.getText().length() - 8, Color.GREEN);
//        inputStreamedData.addNewLineMarkerAt(inputStreamedData.getText().length());
//
//        inputStreamedData.append("redEOL");
//        inputStreamedData.addColour(inputStreamedData.getText().length() - 6, Color.RED);
//        inputStreamedData.addNewLineMarkerAt(inputStreamedData.getText().length());
//
//        inputStreamedData.append("greenEOL");
//        inputStreamedData.addColour(inputStreamedData.getText().length() - 8, Color.GREEN);
//        inputStreamedData.addNewLineMarkerAt(inputStreamedData.getText().length());
//
//        streamingFilter.parse(inputStreamedData, outputStreamedData);
//
//        assertEquals("redEOLredEOL", outputStreamedData.getText());
//        assertEquals(2, outputStreamedData.getColourMarkers().size());
//
//        assertEquals(0, outputStreamedData.getColourMarkers().get(0).position);
//        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(0).color);
//
//        assertEquals(6, outputStreamedData.getColourMarkers().get(1).position);
//        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(1).color);
//    }
}