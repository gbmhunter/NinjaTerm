package ninja.mbedded.ninjaterm.util.tooltip;

import javafx.animation.KeyFrame;
import javafx.animation.Timeline;
import javafx.scene.Node;
import javafx.scene.control.Control;
import javafx.scene.control.Tooltip;
import javafx.scene.control.TooltipBuilder;
import javafx.scene.shape.Rectangle;
import javafx.util.Duration;

import java.lang.reflect.Field;

/**
 * Utility methods for creating tooltips and adding them to nodes.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-09-19
 * @last-modified 2016-11-22
 */
public class TooltipUtil {

    private static void hackStartTiming(javafx.scene.control.Tooltip tooltip, double ms) {
        try {
            Field fieldBehavior = tooltip.getClass().getDeclaredField("BEHAVIOR");
            fieldBehavior.setAccessible(true);
            Object objBehavior = fieldBehavior.get(tooltip);

            Field fieldTimer = objBehavior.getClass().getDeclaredField("activationTimer");
            fieldTimer.setAccessible(true);
            Timeline objTimer = (Timeline) fieldTimer.get(objBehavior);

            objTimer.getKeyFrames().clear();
            objTimer.getKeyFrames().add(new KeyFrame(new Duration(ms)));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void addDefaultTooltip(Node node, String tooltipText) {

        /*Tooltip tooltip = new Tooltip();
        tooltip.setText(tooltipText);
        tooltip.setWrapText(true);
        tooltip.prefWidth(300.0);
        tooltip.maxWidth(300.0);
        tooltip.setWidth(300.0);*/
//
//        Tooltip toolTip = TooltipBuilder.create().text(tooltipText).prefWidth(300).wrapText(true).build();
//
//        // The default tooltip size is too small!
//        toolTip.setStyle("-fx-font-size: 10pt;");
//
//        hackStartTiming(toolTip, 100.0);
//
//        control.setTooltip(toolTip);

        Tooltip tooltip = new Tooltip(tooltipText);

        // WARNING: maxWidth() does not work
        //t.maxWidth(300);
        tooltip.maxWidthProperty().set(300);

        tooltip.setWrapText(true);

        // The default tooltip size is too small!
        tooltip.setStyle("-fx-font-size: 10pt;");

        hackStartTiming(tooltip, 100.0);

        Tooltip.install(node, tooltip);
    }

}
