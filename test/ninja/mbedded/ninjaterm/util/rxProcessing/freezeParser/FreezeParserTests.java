package ninja.mbedded.ninjaterm.util.rxProcessing.freezeParser;

import ninja.mbedded.ninjaterm.util.rxProcessing.newLineParser.NewLineParser;
import ninja.mbedded.ninjaterm.util.rxProcessing.streamedText.StreamedData;
import org.junit.Before;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

/**
 * Unit tests for the <code>{@link FreezeParser}</code> class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-10-17
 * @last-modified   2016-10-17
 */
public class FreezeParserTests {

    private StreamedData inputData;
    private StreamedData releasedData;

    private FreezeParser freezeParser;

    @Before
    public void setUp() throws Exception {
        inputData = new StreamedData();
        releasedData = new StreamedData();

        freezeParser = new FreezeParser();
    }

    @Test
    public void basicTest() throws Exception {

        //==============================================//
        //=================== PASS 1 ===================//
        //==============================================//

        inputData.append("1234");

        freezeParser.parse(inputData, releasedData);

        assertEquals("", inputData.getText());
        assertEquals("1234", releasedData.getText());

        //==============================================//
        //=================== PASS 2 ===================//
        //==============================================//

        inputData.append("5678");

        freezeParser.isFrozen.set(true);
        freezeParser.parse(inputData, releasedData);

        assertEquals("5678", inputData.getText());
        assertEquals("1234", releasedData.getText());

    }

}