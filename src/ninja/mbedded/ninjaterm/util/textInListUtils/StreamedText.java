package ninja.mbedded.ninjaterm.util.textInListUtils;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.scene.Node;

/**
 * Created by gbmhu on 2016-09-28.
 */
public class StreamedText {
    public String appendText = "";
    public ObservableList<Node> textNodes = FXCollections.observableArrayList();
}
