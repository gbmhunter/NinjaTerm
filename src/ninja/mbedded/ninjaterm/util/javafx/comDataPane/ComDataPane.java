package ninja.mbedded.ninjaterm.util.javafx.comDataPane;

import javafx.scene.layout.StackPane;
import javafx.scene.paint.Color;
import org.fxmisc.richtext.StyledTextArea;


/**
 * Created by gbmhu on 2016-11-14.
 */
public class ComDataPane extends StackPane {

    private final StyledTextArea<ParStyle, TextStyle> area = new StyledTextArea<>(
            ParStyle.EMPTY, ( paragraph, style) -> paragraph.setStyle(style.toCss()),
            TextStyle.EMPTY.updateFontSize(12).updateFontFamily("Serif").updateTextColor(Color.BLACK),
            ( text, style) -> text.setStyle(style.toCss()));

    public ComDataPane() {

        getChildren().add(area);

    }

}
