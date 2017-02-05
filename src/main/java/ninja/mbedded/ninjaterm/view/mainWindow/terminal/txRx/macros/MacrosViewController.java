package ninja.mbedded.ninjaterm.view.mainWindow.terminal.txRx.macros;

import javafx.collections.ListChangeListener;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.scene.Node;
import javafx.scene.layout.GridPane;
import ninja.mbedded.ninjaterm.model.Model;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;
import ninja.mbedded.ninjaterm.model.terminal.txRx.macros.Macro;
import ninja.mbedded.ninjaterm.util.javafx.GridPaneHelper;
import org.controlsfx.glyphfont.GlyphFont;

import java.util.ListIterator;

/**
 * View controller for the "display" settings pop-up window.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-11-05
 * @last-modified 2016-11-14
 */
public class MacrosViewController {

    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    private GridPane macroGridPane;


    //================================================================================================//
    //=========================================== CLASS FIELDS =======================================//
    //================================================================================================//

    Model model;
    Terminal terminal;
    GlyphFont glyphFont;

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public MacrosViewController() {
    }

    public void init(Model model, Terminal terminal, GlyphFont glyphFont) {

        this.model = model;
        this.terminal = terminal;
        this.glyphFont = glyphFont;

        terminal.txRx.macroManager.macros.addListener((ListChangeListener.Change<? extends Macro> c) -> {

            //System.out.println("Macro list in model has been changed.");
            redrawMacroGridPane();
        });

        redrawMacroGridPane();

    }

    public void redrawMacroGridPane() {

        // Remove all nodes except first row
        ObservableList<Node> children = macroGridPane.getChildren();
        for (ListIterator<Node> iter = children.listIterator(); iter.hasNext(); ) {
            Node node = iter.next();
            if (GridPane.getRowIndex(node) != 0) {
                iter.remove();
            }
        }

        // Repopulate GridPane with macro rows
        for(Macro macro : terminal.txRx.macroManager.macros) {

            MacroRow macroRow = new MacroRow(model, terminal, macro, glyphFont);
            macroGridPane.addRow(GridPaneHelper.getNumRows(macroGridPane), macroRow.nameTextField, macroRow.sequenceTextField, macroRow.runButton);

        }


    }
}
