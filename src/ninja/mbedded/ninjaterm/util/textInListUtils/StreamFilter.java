package ninja.mbedded.ninjaterm.util.textInListUtils;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.scene.Node;
import javafx.scene.text.Text;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Created by gbmhu on 2016-09-28.
 */
public class StreamFilter {

    /**
     * Held text that once released, will be appended to the last released text node.
     */
    private String heldTextForLastNode = "";

    /**
     * Help text nodes that will be released once a match occurs.
     */
    private ObservableList<Node> heldNodes = FXCollections.observableArrayList();

    /**
     * This method provides a filtering function based on an incoming stream of data.
     *
     *
     *
     * @param textToAppendedToLastNode  New un-filtered text to be appended to the last existing text node.
     * @param newTextNodes              New un-filtered text nodes to be added to the end of the existing ones.
     * @param filterText                Text to filter by.
     */
    public void streamFilter(
            String textToAppendedToLastNode,
            ObservableList<Node> newTextNodes,
            String filterText) {

        // Update the internal "hold" variables
        Text lastTextNode = (Text)heldNodes.get(heldNodes.size() - 1);
        lastTextNode.setText(lastTextNode.getText() + textToAppendedToLastNode);
        heldNodes.addAll(newTextNodes);

        System.out.println("Internal hold variables updated. heldTextForLastNode = " + heldTextForLastNode);


        // heldTextForLastNode + all text in heldNodes should equal a line of text being held intil
        // a pattern match occurs
        String heldLineOfText = heldTextForLastNode;
        for(Node node : heldNodes){
            heldLineOfText += ((Text)node).getText();
        }

        System.out.println("Concatenated line of text = " + heldLineOfText);

        // Search for new line characters
        String lines[] = heldLineOfText.split("(?<=[\\r])");

        // This keeps track of where we are relative to the start of the
        // heldLineOfText variable
        int currCharIndex = 0;

        for(String line : lines) {
            Pattern pattern = Pattern.compile(filterText);
            Matcher matcher = pattern.matcher(line);

            if(matcher.find()) {
                // Match in line found!
                System.out.println("Match in line found. Line = " + line);

                // We can release all text/nodes up to the end of this line
                int numCharsToRelease = currCharIndex + matcher.end();
                System.out.println("numCharsToRelease = " + numCharsToRelease);

            } else {
                // No match found
                System.out.println("No match found. Line = " + line);
            }

            // Increase the current character index by the length of this line
            currCharIndex += line.length();
        }

    }


}
