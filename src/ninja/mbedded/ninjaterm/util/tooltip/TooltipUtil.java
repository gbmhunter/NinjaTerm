package ninja.mbedded.ninjaterm.util.tooltip;

import javafx.animation.KeyFrame;
import javafx.animation.Timeline;
import javafx.scene.Node;
import javafx.scene.control.Control;
import javafx.scene.control.Tooltip;
import javafx.scene.control.TooltipBuilder;
import javafx.util.Duration;

import java.lang.reflect.Field;

/**
 * Created by gbmhu on 2016-09-19.
 */
public class TooltipUtil {

    public static void hackStartTiming(javafx.scene.control.Tooltip tooltip, double ms) {
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

    public static void addDefaultTooltip(Control control, String tooltipText) {

        /*Tooltip tooltip = new Tooltip();
        tooltip.setText(tooltipText);
        tooltip.setWrapText(true);
        tooltip.prefWidth(300.0);
        tooltip.maxWidth(300.0);
        tooltip.setWidth(300.0);*/

        Tooltip toolTip = TooltipBuilder.create().text(tooltipText).prefWidth(300).wrapText(true).build();

        // The default tooltip size is too small!
        toolTip.setStyle("-fx-font-size: 10pt;");

        hackStartTiming(toolTip, 100.0);

        control.setTooltip(toolTip);
    }

}
