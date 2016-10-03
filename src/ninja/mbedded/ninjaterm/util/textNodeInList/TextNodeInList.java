package ninja.mbedded.ninjaterm.util.textNodeInList;

import javafx.collections.ObservableList;
import javafx.scene.Node;
import javafx.scene.text.Text;

/**
 * Utility methods to help with the processing of Text nodes within a List. Used on the list of nodes stored
 * inside a TextFlow object.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-27
 * @last-modified   2016-10-03
 */
public class TextNodeInList {

    /**
     * Removes the specified number of characters from the text nodes provided inside the observable list.
     * Removes characters from the oldest text nodes first (e.g. at index 0).
     * @param observableList        The list of Text nodes to remove characters from.
     * @param numCharsToRemove      The number of characters you wish to remove.
     */
    public static void trimTextNodesFromStart(ObservableList<Node> observableList, int numCharsToRemove) {

        int numRemainingCharsToRemove = numCharsToRemove;

        // Remove chars from the first nodes
        while(numRemainingCharsToRemove > 0) {

            if(observableList.size() == 0) {
                throw new IllegalArgumentException("numCharsToRemove was larger than the number of characters in observableList.");
            }

            // Get number of characters in current node index
            Text currTextNode = (Text)observableList.get(0);

            int numCharsInCurrTextNode = currTextNode.getText().length();
            if(numCharsInCurrTextNode >= numRemainingCharsToRemove) {
                // Current text node has more chars than we need to remove, so take a substring of the
                // text. This will be the only iteration of this loop
                currTextNode.setText(currTextNode.getText().substring(numRemainingCharsToRemove));
                numRemainingCharsToRemove = 0;
            } else {
                // Current text node is smaller than the number of chars we need to remove,
                // so completely remove this node, update the remaining chars to trim, and
                // move onto next iteration of loop
                numRemainingCharsToRemove -= numCharsInCurrTextNode;
                // Entirely remove this node from the list
                observableList.remove(currTextNode);
            }
        }
    }
}
