package ninja.mbedded.ninjaterm.util.ansiEscapeCodes;

import javafx.collections.ObservableList;
import javafx.scene.Node;
import javafx.scene.text.Text;
import javafx.scene.text.TextFlow;

/**
 * Created by gbmhu on 2016-09-26.
 */
public class Processor {

    public void parseString(ObservableList<Node> textNodes, String inputString) {

        // If no escape character has been detected, we assume we can place the text in the last text node

        boolean noChange = true;
        if(noChange) {
            Text lastTextNode = (Text)textNodes.get(textNodes.size() - 1);
            lastTextNode.setText(inputString);
        }
    }

}
