package ninja.mbedded.ninjaterm.view.splashScreen;

import javafx.animation.Animation;
import javafx.animation.FadeTransition;
import javafx.animation.KeyFrame;
import javafx.animation.Timeline;
import javafx.beans.property.SimpleBooleanProperty;
import javafx.fxml.FXML;
import javafx.scene.paint.Color;
import javafx.scene.text.*;
import javafx.util.Duration;
import ninja.mbedded.ninjaterm.util.appInfo.AppInfo;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by gbmhu on 2016-09-20.
 */
public class SplashScreenViewController {


    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    public TextFlow loadingMsgsTextFlow;


    List<String> loadingMsgs = new ArrayList<>();

    private int loadingMsgIndex = 0;

    Text loadingMsgText = new Text();

    private Timeline timeline;

    public SimpleBooleanProperty isFinished = new SimpleBooleanProperty(false);

    /**
     * This array is used to give the typing of characters onto the splash screen a "human-like"
     * feel. Each entry corresponds to the time (in milliseconds) before the mapped character
     * in the nameAndVerisonString is displayed.
     * <p>
     * Make sure this array has the same number of entries as the number of characters in the
     * string.
     */
    private final double[] charIntervalsMs = new double[]{
            25,
            1500,   // N
            125,    // i
            150,    // n
            200,    // j
            150,    // a
            75,     // T
            100,    // e
            250,    // r
            100,    // m
            50,     //
            300,    // v
            100,    // X
            150,    // .
            75,    // X
            150,    // .
            125,    // X
            50,    // \r
            50,    // \r
            300,    // A
            125,    //
            150,    // f
            50,     // r
            75,     // e
            25,     // e
            50,     //
            100,    // t
            125,    // o
            75,     // o
            100,    // l
            50,     //
            200,    // b
            100,    // y
            50,     //
            250,    // w
            100,    // w
            75,     // w
            50,     // .
            150,    // m
            125,    // b
            150,    // e
            125,    // d
            25,     // d
            100,    // e
            125,    // d
            50,     // .
            200,    // n
            175,    // i
            100,    // n
            50,     // j
            100,    // a
            75,     // \r
            75,     // \r
    };

    public SplashScreenViewController() {
        /*FXMLLoader fxmlLoader = new FXMLLoader(getClass().getResource(
                "SplashScreenView.fxml"));

        fxmlLoader.setRoot(this);
        fxmlLoader.setController(this);

        try {
            fxmlLoader.load();
        } catch (IOException exception) {
            throw new RuntimeException(exception);
        }*/




    }

    public void init() {
        // Add loading messages to the list
        loadingMsgs.add("Using all processing power to render splash screen.");
        loadingMsgs.add("Looking for operating system.");
        loadingMsgs.add("Releasing the Kraken.");
        loadingMsgs.add("Scanning for ports, found many ships.");
        loadingMsgs.add("Turning volume up to 11.");
        loadingMsgs.add("Bricking fake FTDI chips.");
        loadingMsgs.add("Downloading more RAM.");
        loadingMsgs.add("Unpacking christmas presents.");
        loadingMsgs.add("Forgot which one was CTS and which was RTS.");
        loadingMsgs.add("The answer is 42.");
        loadingMsgs.add("Incorrect voltage levels are serial killers.");
        loadingMsgs.add("All your base are belong to us.");
        loadingMsgs.add("Uploading user data to NSA.");
        loadingMsgs.add("Setting IE9 as default browser.");
        loadingMsgs.add("Booting SkyNet.");
        loadingMsgs.add("Crypto-locking personal files.");
        loadingMsgs.add("Remember, DB-9 is actually DE-9.");
        loadingMsgs.add("Installing bitcoin miner.");
        loadingMsgs.add("Correcting speling.");
        loadingMsgs.add("Setting heisenbugs to unknown states.");
        loadingMsgs.add("Uninstalling RealTerm, Terminal by Br@y, PuTTy and Termite.");
        loadingMsgs.add("Wondering if you've remembered the baud rate.");
        loadingMsgs.add("Finding nearby hot singles.");
        loadingMsgs.add("Putting down Windows XP seach dog.");
        loadingMsgs.add("Persecuting minorities.");
        loadingMsgs.add("Patching Java security flaws.");
        loadingMsgs.add("Voting for Donald Trump.");
        loadingMsgs.add("Loading clippy animation.");
        loadingMsgs.add("Discovering this one weird trick, mind will be blown.");
        loadingMsgs.add("Finished wasting user's time.");

        // This makes the bogus text look more like it's in a proper terminal window
        loadingMsgsTextFlow.setTextAlignment(TextAlignment.JUSTIFY);

        //==============================================//
        //============= CREATE "^" TEXT ================//
        //==============================================//

        Text terminalStartText = new Text(">");
        terminalStartText.setFont(Font.font("monospace", FontWeight.BOLD, 20));
        terminalStartText.setFill(Color.LIME);

        loadingMsgsTextFlow.getChildren().add(terminalStartText);

        //==============================================//
        //========= CREATE FLASHING CARET ==============//
        //==============================================//

        Text caretText = new Text("█");
        caretText.setFont(Font.font("monospace", FontWeight.BOLD, 20));
        caretText.setFill(Color.LIME);

        // Add an animation so the caret blinks
        FadeTransition caretFt = new FadeTransition(Duration.millis(200), caretText);
        caretFt.setFromValue(1.0);
        caretFt.setToValue(0.1);
        caretFt.setCycleCount(Timeline.INDEFINITE);
        caretFt.setAutoReverse(true);
        caretFt.play();

        // Add caret to textflow object. It should always remain as the last child, to give the
        // proper appearance
        loadingMsgsTextFlow.getChildren().add(caretText);
    }

    public void startNameVersionInfoMsg() {
        // Create Text object to hold application and version text
        loadingMsgText = new Text();
        loadingMsgText.setFill(Color.LIME);
        loadingMsgText.setFont(Font.font("monospace", FontWeight.NORMAL, 20));

        // Add text object as second-to-lat child of TextFlow (flashing caret is last child)
        loadingMsgsTextFlow.getChildren().add(loadingMsgsTextFlow.getChildren().size() - 1, loadingMsgText);

        // Get version
        String versionNumber = AppInfo.getVersionNumber();

        // The version can be null, but this should only occur in a development
        // environment
        if (versionNumber == null) {
            versionNumber = "?.?.?";
        }

        String nameAndVersionString = " NinjaTerm v" + versionNumber + "\r\rA free tool by www.mbedded.ninja\r\r";


        // Show name of application and version
        Timeline nameAndVersionTimeline = new Timeline();

        // This variable keeps track of the total time from the timeline is started to display
        // the keyframe, as this is the format the keyframe wants
        double summedTimeInMs = 0.0;

        for (int i = 0; i < nameAndVersionString.length(); i++) {
            final int test = i;

            summedTimeInMs += charIntervalsMs[i];

            if (i == nameAndVersionString.length() - 1) {
                nameAndVersionTimeline.getKeyFrames().add(new KeyFrame(Duration.millis(summedTimeInMs), event -> {
                    loadingMsgText.setText(loadingMsgText.getText() + nameAndVersionString.charAt(test));

                    // Start the next sequence after a fixed delay, where we display all of the bogus loading messages
                    timeline = new Timeline(new KeyFrame(
                            Duration.millis(500),
                            ae -> startBogusLoadingMsgs()));
                    timeline.play();

                }));
            } else {
                nameAndVersionTimeline.getKeyFrames().add(new KeyFrame(Duration.millis(summedTimeInMs), event -> {
                    loadingMsgText.setText(loadingMsgText.getText() + nameAndVersionString.charAt(test));
                }));
            }
        }

        // This causes the intro text on the splash screen to be displayed
        // (not the bogus text, this comes later)
        nameAndVersionTimeline.play();
    }

    private void startBogusLoadingMsgs() {
        // Start loading messages
        timeline = new Timeline(new KeyFrame(
                Duration.millis(75),
                ae -> updateBogusLoadingMsgs()));

        // timeline will be stopped when last bogus message has been printed.
        timeline.setCycleCount(Animation.INDEFINITE);
        timeline.play();
    }

    public void updateBogusLoadingMsgs() {

        loadingMsgText.setText(loadingMsgText.getText() + loadingMsgs.get(loadingMsgIndex++) + " ");

        if (loadingMsgIndex >= loadingMsgs.size()) {
            // We have reached the end of the loading messages!
            timeline.stop();

            // We are now finished. Setting this property to true allows the main function
            // to listen for this change and load up the main window now.
            isFinished.set(true);
        }

    }

}
