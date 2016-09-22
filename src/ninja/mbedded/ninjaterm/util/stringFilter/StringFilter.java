package ninja.mbedded.ninjaterm.util.stringFilter;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.ListIterator;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Created by gbmhu on 2016-09-21.
 */
public class StringFilter {

    public static String filterByLine(String inputString, String filterText) {
        // Split the string up into separate lines
        //String lines[] = inputString.split("\\r");
        String lines[] = inputString.split("(?<=[\\r])");

        List<String> linesAsList = new ArrayList<String>(Arrays.asList(lines));

        // Iterate through each string
        Pattern p = Pattern.compile(filterText);
        for (ListIterator<String> iter = linesAsList.listIterator(); iter.hasNext(); ) {

            String line = iter.next();
            Matcher m = p.matcher(line);

            // If this line does not match the filter text, remove element from
            // the list and then continue
            if(!m.find()) {
                iter.remove();
            }
        }

        // Concatenate all the lines back into a single string
        //String[] filteredLinesAsArray = (String[])linesAsList.toArray(new String[linesAsList.size()]);
        //String filteredString = Arrays.toString(filteredLinesAsArray);
        StringBuilder sb = new StringBuilder();
        for(String s: linesAsList)
        {
            sb.append(s);
        }
        return sb.toString();

    }

}
