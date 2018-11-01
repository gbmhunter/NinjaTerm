package ninja.mbedded.ninjaterm.util.javafx;

import javafx.scene.control.Control;

/**
 * Contains a bunch of useful functions for manipulating the styles of javafx components.
 *
 *  @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 *  @last-modified  2018-10-31
 *  @since          2018-10-31
 */
public class CssTools {

    public static void addClass(Control control, String className) {
        if (!control.getStyleClass().contains(className)) {
            control.getStyleClass().add(className);
        }
    }

    public static void removeClass(Control control, String className) {
        if (control.getStyleClass().contains(className)) {
            control.getStyleClass().remove(className);
        }
    }
}
