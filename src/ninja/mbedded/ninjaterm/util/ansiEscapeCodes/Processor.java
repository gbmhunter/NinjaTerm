package ninja.mbedded.ninjaterm.util.ansiEscapeCodes;

import javafx.collections.ObservableList;
import javafx.scene.Node;
import javafx.scene.paint.Color;
import javafx.scene.text.Text;
import sun.nio.cs.US_ASCII;

import java.math.BigInteger;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Created by gbmhu on 2016-09-26.
 */
public class Processor {

    Map<String, Color> codeToNormalColourMap = new HashMap<>();
    Map<String, Color> codeToBoldColourMap = new HashMap<>();

    public Processor() {
        // Populate the map with data
        codeToNormalColourMap.put("31", Color.rgb(170, 0, 0));
        codeToNormalColourMap.put("32", Color.rgb(0, 170, 0));

        codeToBoldColourMap.put("31", Color.rgb(255, 85, 85));
        codeToBoldColourMap.put("32", Color.rgb(85, 255, 85));
    }

    public void parseString(ObservableList<Node> textNodes, String inputString) {


        Pattern p = Pattern.compile("\u001B\\[[;\\d]*m");
        //Pattern p = Pattern.compile("testing");
        Matcher m = p.matcher(inputString);


        if (!m.find()) {
            // No match was found, add all text to existing text node
            Text lastTextNode = (Text) textNodes.get(textNodes.size() - 1);
            lastTextNode.setText(inputString);
            return;
        }

        //String remainingInput = "";
        int currPositionInString = 0;

        m.reset();
        while (m.find()) {
            System.out.println("find() is true. m.start() = " + m.start() + ", m.end() = " + m.end() + ".");

            // Everything up to the first matched character can be added to the last existing text node
            String preText = inputString.substring(currPositionInString, m.start());
            Text lastTextNode = (Text) textNodes.get(textNodes.size() - 1);
            lastTextNode.setText(preText);

            // Now extract the code
            String ansiEscapeCode = inputString.substring(m.start(), m.end());
            System.out.println("ANSI esc seq = " + toHex(ansiEscapeCode));

            // Save the remaining text to process
            //remainingInput = inputString.substring(m.end(), inputString.length());

            // Extract the numbers from the escape code
            String[] numbers = extractNumbersAsArray(ansiEscapeCode);

            Map<String, Color> correctMapToUse;
            if(numbers.length == 1) {
                correctMapToUse = codeToNormalColourMap;
            } else if(numbers.length == 2 && numbers[1].equals("1")) {
                correctMapToUse = codeToBoldColourMap;
            } else {
                throw new RuntimeException("Numbers not recognised!");
            }

            // Get the colour associated with this code
            Color color = correctMapToUse.get(numbers[0]);

            // Create new Text object with this new color, and add to the text nodes
            Text newText = new Text();
            newText.setFill(color);
            textNodes.add(newText);

            currPositionInString = m.end();

        }

        // There might be remaining input after the last ANSI escpe code has been processed.
        // This can all be put in the last text node, which should be by now set up correctly.
        if (currPositionInString != (inputString.length() - 1)) {
            Text lastTextNode = (Text) textNodes.get(textNodes.size() - 1);
            lastTextNode.setText(inputString.substring(currPositionInString, inputString.length()));
        }


        if (m.matches()) {
            System.out.println("Got full match.");
        }

        if (m.hitEnd()) {
            System.out.println("Got partial match.");
        }

    }

    public String toHex(String arg) {
        return String.format("%x", new BigInteger(1, arg.getBytes(US_ASCII.defaultCharset())));
    }

    public String toString(String[] stringA) {
        String output = "{ ";
        for (String string : stringA) {
            output = output + string + ", ";
        }
        return output;
    }

    private String[] extractNumbersAsArray(String ansiEscapeCode) {

        // Input should be in the form
        // (ESC)[xx;xx;...xxm
        // We want to extract the x's

        // Trim of the (ESC) and [ chars from the start, and the m from the end
        String trimmedString = ansiEscapeCode.substring(2, ansiEscapeCode.length() - 1);

        System.out.println("trimmedString = " + trimmedString);

        String[] numbers = trimmedString.split(";");

        System.out.println("numbers = " + toString(numbers));

        return numbers;
    }

}
