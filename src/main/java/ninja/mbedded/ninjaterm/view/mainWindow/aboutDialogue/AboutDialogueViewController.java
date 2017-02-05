package ninja.mbedded.ninjaterm.view.mainWindow.aboutDialogue;

import javafx.beans.property.SimpleDoubleProperty;
import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.value.ChangeListener;
import javafx.collections.ListChangeListener;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.Hyperlink;
import javafx.scene.control.Label;
import javafx.scene.control.ScrollPane;
import javafx.scene.layout.Pane;
import javafx.scene.text.TextFlow;
import javafx.stage.Stage;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.util.appInfo.AppInfo;
import ninja.mbedded.ninjaterm.util.javafx.led.Led;
import org.controlsfx.glyphfont.FontAwesome;
import org.controlsfx.glyphfont.GlyphFont;

import java.awt.*;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;

/**
 * Controller for the "About" dialogue window.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-11-23
 * @last-modified   2016-11-23
 */
public class AboutDialogueViewController{

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    private Pane rootPane;

    @FXML
    private Label versionLabel;

    @FXML
    private Hyperlink websiteHyperlink;

    @FXML
    private Hyperlink githubHyperlink;

    @FXML
    private Button closeButton;

    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    private Model model;
    private GlyphFont glyphFont;

    private Stage stage;


    public void init(Model model, GlyphFont glyphFont, Stage stage) {
        this.model = model;
        this.glyphFont = glyphFont;

        // Apply stylesheet
        rootPane.getStylesheets().add(
                getClass().getResource("/ninja/mbedded/ninjaterm/resources/style.css").toExternalForm());

        setupVersion();

        websiteHyperlink.setOnAction(e -> loadWebpage(websiteHyperlink.getText()));
        githubHyperlink.setOnAction(e -> loadWebpage(githubHyperlink.getText()));

        websiteHyperlink.setGraphic(glyphFont.create(FontAwesome.Glyph.HOME));
        githubHyperlink.setGraphic(glyphFont.create(FontAwesome.Glyph.GITHUB));

        closeButton.setOnAction(e -> stage.close());

    }

    private void loadWebpage(String url) {

        try {
            Desktop.getDesktop().browse(new URI(url));
        } catch (IOException e1) {
            e1.printStackTrace();
        } catch (URISyntaxException e1) {
            e1.printStackTrace();
        }

    }

    private void setupVersion() {
        String versionNumber = AppInfo.getVersionNumber();

        // Sometimes the version number will be null, but this should only occur when running from IntelliJ
        // in a development environment (install4j will add the appropriate .dll when a .exe is built)
        if (versionNumber == null) {
            versionNumber = "?.?.?";
        }
        versionLabel.setText("v" + versionNumber);

    }

}
