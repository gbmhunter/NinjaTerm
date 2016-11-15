package ninja.mbedded.ninjaterm.util.javafx.ComDataPane;

import javafx.scene.paint.*;
import javafx.scene.paint.Color;
import ninja.mbedded.ninjaterm.JavaFXThreadingRule;
import ninja.mbedded.ninjaterm.util.javafx.comDataPane.ComDataPane;
import ninja.mbedded.ninjaterm.util.rxProcessing.streamedData.StreamedData;
import ninja.mbedded.ninjaterm.util.stringFilter.StringFilter;
import org.fxmisc.richtext.model.StyleSpan;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;

import java.awt.*;
import java.time.format.TextStyle;

import static org.junit.Assert.assertEquals;

/**
 * Unit tests for the <code>{@link ninja.mbedded.ninjaterm.util.javafx.comDataPane.ComDataPane}</code> class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-11-15
 * @last-modified   2016-11-15
 */
public class ComDataPaneTest {

    ComDataPane comDataPane;

    StreamedData streamedData;

    /**
     * Including this variable in class allows JavaFX objects to be created in tests.
     */
    @Rule
    public JavaFXThreadingRule javafxRule = new JavaFXThreadingRule();

    @Before
    public void setUp() throws Exception {
        comDataPane = new ComDataPane();
        streamedData = new StreamedData();
    }

    @Test
    public void streamedDataIsClearedTest() throws Exception {

        streamedData.append("123");
        comDataPane.addData(streamedData);

        assertEquals("", streamedData.getText());
        assertEquals(0, streamedData.getColourMarkers().size());
        assertEquals(null, streamedData.getColorToBeInsertedOnNextChar());
        assertEquals(0, streamedData.getNewLineMarkers().size());
    }

    @Test
    public void singleColourTest() throws Exception {

        streamedData.append("123");
        comDataPane.addData(streamedData);

        assertEquals(3, comDataPane.styledTextArea.getLength());
        // Make sure there is only 1 style
        assertEquals(1, comDataPane.styledTextArea.getStyleSpans(0,comDataPane.styledTextArea.getLength()).getSpanCount());

        assertEquals(
                Color.GREEN,
                comDataPane.styledTextArea.getStyleSpans(0,comDataPane.styledTextArea.getLength()).getStyleSpan(0).getStyle().getTextColor());

    }

    @Test
    public void twoColourTest() throws Exception {

        streamedData.append("123456");
        streamedData.addColour(3, Color.RED);

        comDataPane.addData(streamedData);

        assertEquals(6, comDataPane.styledTextArea.getLength());
        // Make sure there are two styles
        assertEquals(2, comDataPane.styledTextArea.getStyleSpans(0, comDataPane.styledTextArea.getLength()).getSpanCount());

        assertEquals(
                Color.GREEN,
                comDataPane.styledTextArea.getStyleSpans(0, comDataPane.styledTextArea.getLength()).getStyleSpan(0).getStyle().getTextColor());

        assertEquals(
                Color.RED,
                comDataPane.styledTextArea.getStyleSpans(0, comDataPane.styledTextArea.getLength()).getStyleSpan(1).getStyle().getTextColor());

    }

    @Test
    public void colourToBeInsertedOnNextCharTest() throws Exception {

        streamedData.append("123");
        streamedData.setColorToBeInsertedOnNextChar(Color.RED);
        comDataPane.addData(streamedData);

        streamedData.append("456");
        comDataPane.addData(streamedData);

        assertEquals(6, comDataPane.styledTextArea.getLength());
        // Make sure there are two styles
        assertEquals(2, comDataPane.styledTextArea.getStyleSpans(0, comDataPane.styledTextArea.getLength()).getSpanCount());

        assertEquals(
                Color.GREEN,
                comDataPane.styledTextArea.getStyleSpans(0, comDataPane.styledTextArea.getLength()).getStyleSpan(0).getStyle().getTextColor());

        assertEquals(
                Color.RED,
                comDataPane.styledTextArea.getStyleSpans(0, comDataPane.styledTextArea.getLength()).getStyleSpan(1).getStyle().getTextColor());

    }

}