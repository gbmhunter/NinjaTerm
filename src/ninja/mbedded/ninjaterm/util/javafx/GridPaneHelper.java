package ninja.mbedded.ninjaterm.util.javafx;

import javafx.scene.layout.GridPane;

import java.lang.reflect.Method;

/**
 * Created by gbmhu on 2016-11-07.
 */
public class GridPaneHelper {

    public static int getNumRows(GridPane gridPane) {

        int numRows;
        try {
            Method method = gridPane.getClass().getDeclaredMethod("getNumberOfRows");
            method.setAccessible(true);
            numRows = (Integer) method.invoke(gridPane);

        } catch (Exception e) {
            throw new RuntimeException("Could not call the getNumberOfRows() method of the GridPane class by reflection.");
        }

        return numRows;

    }
}