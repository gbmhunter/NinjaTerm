package ninja.mbedded.ninjaterm.model.terminal.txRx.macros;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;

/**
 *
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-11-06
 * @last-modified   2016-11-07
 */
public class MacroManager {

    private final int DEFAULT_NUM_OF_MACROS = 3;

    public ObservableList<Macro> macros = FXCollections.observableArrayList();

    public MacroManager() {

        // Add default macros
        for(int i = 0; i < DEFAULT_NUM_OF_MACROS; i++) {
            macros.add(new Macro());
        }
    }

}
