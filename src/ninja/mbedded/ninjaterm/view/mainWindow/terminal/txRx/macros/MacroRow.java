package ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx.macros;

import javafx.scene.control.Button;
import javafx.scene.control.TextField;
import org.controlsfx.glyphfont.FontAwesome;
import org.controlsfx.glyphfont.GlyphFont;

/**
 * Created by gbmhu on 2016-11-07.
 */
public class MacroRow {

    public TextField name = new TextField();
    public TextField sequence = new TextField();
    public Button sendButton = new Button();

    public MacroRow(GlyphFont glyphFont) {

        name.setPrefWidth(50);
        sequence.setPrefWidth(80);

        sendButton.setGraphic(glyphFont.create(FontAwesome.Glyph.SHARE_SQUARE));
    }
}
