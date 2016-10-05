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

/**
 * Controller for the splash screen.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-09-20
 * @last-modified 2016-10-04
 */
public class SplashScreenViewController {


    //================================================================================================//
    //========================================== FXML BINDINGS =======================================//
    //================================================================================================//

    @FXML
    public TextFlow loadingMsgsTextFlow;

    //================================================================================================//
    //======================================== CLASS VARIABLES =======================================//
    //================================================================================================//

    private int loadingMsgIndex = 0;

    Text loadingMsgText = new Text();

    private Timeline timeline;

    /**
     * Used to indicate when the splash screen has finished.
     */
    public SimpleBooleanProperty isFinished = new SimpleBooleanProperty(false);

    /**
     * The bogus "loading" messages displayed on the splash screen after the app name, version and basic
     * info is displayed.
     */
    private final String[] bogusMessages = {
            "Using all processing power to render splash screen.",
            "Looking for operating system.",
            "Releasing the Kraken.",
            "Scanning for ports, found many ships.",
            "Turning volume up to 11.",
            "Bricking fake FTDI chips.",
            "Downloading more RAM.",
            "Unpacking christmas presents.",
            "Forgot which one was CTS and which was RTS.",
            "The answer is 42.",
            "Incorrect voltage levels are serial killers.",
            "All your base are belong to us.",
            "Uploading user data to NSA.",
            "Setting IE9 as default browser.",
            "Booting SkyNet.",
            "Crypto-locking personal files.",
            "Remember, DB-9 is actually DE-9.",
            "Installing bitcoin miner.",
            "Correcting speling.",
            "Setting heisenbugs to unknown states.",
            "Uninstalling RealTerm, Terminal by Br@y, PuTTy and Termite.",
            "Wondering if you've remembered the baud rate.",
            "Finding nearby hot singles.",
            "Putting down Windows XP seach dog.",
            "Persecuting minorities.",
            "Patching Java security flaws.",
            "Voting for Donald Trump.",
            "Loading clippy animation.",
            "Discovering this one weird trick, mind will be blown.",
            "Finished wasting user's time."
    };

    private final double intervalBetweenEachBogusMsgMs = 100;

    /**
     * This array is used to give the typing of characters onto the splash screen a "human-like"
     * feel. Each entry corresponds to the time (in milliseconds) before the mapped character
     * in the nameAndVerisonString is displayed.
     * <p>
     * Make sure this array has the same number of entries as the number of characters in the
     * string.
     */
    private final double[] charIntervalsMs = new double[]{
            25,     //
            1500,   // N
            75,    // i
            50,    // n
            150,    // j
            100,    // a
            75,     // T
            100,    // e
            50,    // r
            75,    // m
            25,     //
            300,    // v
            75,    // X
            150,    // .
            75,     // X
            50,    // .
            125,    // X
            50,     // \r
            25,     // \r
            300,    // A
            100,    //
            100,    // f
            50,     // r
            20,     // e
            25,     // e
            10,     //
            100,    // t
            75,    // o
            20,     // o
            60,    // l
            50,     //
            100,    // b
            20,    // y
            50,     //
            250,    // w
            50,    // w
            20,     // w
            50,     // .
            150,    // m
            100,    // b
            90,    // e
            100,    // d
            25,     // d
            70,    // e
            90,    // d
            50,     // .
            140,    // n
            75,    // i
            60,    // n
            50,     // j
            70,    // a
            75,     // \r
            75,     // \r
            // <---- START OF BOGUS MESSAGES HERE
    };

    //================================================================================================//
    //========================================== CLASS METHODS =======================================//
    //================================================================================================//

    public SplashScreenViewController() {
    }

    public void init() {

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

    /**
     * Initialises and starts the animation of the app name, version and info on
     * the splash screen.
     */
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

    /**
     * Initialises and starts the animation of the bogus messages on the splash screen.
     */
    private void startBogusLoadingMsgs() {
        // Start loading messages
        timeline = new Timeline(new KeyFrame(
                Duration.millis(intervalBetweenEachBogusMsgMs),
                ae -> updateBogusLoadingMsgs()));

        // timeline will be stopped when last bogus message has been printed.
        timeline.setCycleCount(Animation.INDEFINITE);
        timeline.play();
    }

    /**
     * Called by lambda expression defined in startBogusLoadingMsgs(), once every keyframe, and
     * adds a new bogus message to the splash screen.
     */
    public void updateBogusLoadingMsgs() {

        loadingMsgText.setText(loadingMsgText.getText() + bogusMessages[loadingMsgIndex++] + " ");

        if (loadingMsgIndex >= bogusMessages.length) {
            // We have reached the end of the loading messages!
            timeline.stop();

            // We are now finished. Setting this property to true allows the main function
            // to listen for this change and load up the main window now.
            isFinished.set(true);
        }
    }
}
