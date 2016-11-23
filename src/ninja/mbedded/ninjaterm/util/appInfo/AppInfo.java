package ninja.mbedded.ninjaterm.util.appInfo;

import com.install4j.api.ApplicationRegistry;

/**
 * Utility class to get application info (such as version number).
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-09-19
 * @last-modified 2016-09-20
 */
public class AppInfo {

    /**
     * This ID is assigned by the install4j GUI (on the Installer->Update Options page). This should not change
     * for the life of the application.
     */
    public static final String applicationId = "3655-3380-6749-0061";

    /**
     * Retrieves the version number of the app, as defined by install4j when the installer was created.
     * Returns null if a version number can't be found.
     * @return The version number, as a string. Returns null if a version number can't be found.
     */
    public static String getVersionNumber() {
        // Get version number using install4j runtime API
        ApplicationRegistry.ApplicationInfo[] applicationInfo;

        try {
            applicationInfo = ApplicationRegistry.getApplicationInfoById(applicationId);
        } catch (UnsatisfiedLinkError e) {
            // This can occur if the .dll cannot be found. This can occur in a development environment
            // (i.e. running from within IntelliJ, but should not occur with a .exe built with install4j.
            return null;
        } catch (NoClassDefFoundError e) {
            // For some reason, this exception can also been thrown in the development environment
            return null;
        }

        // applicationInfo array will be 0 in length if not application info for the provided ID
        // was found. If application info was found, index 0 will have the most recent info
        if(applicationInfo.length > 0) {
            return applicationInfo[0].getVersion();
        } else {
            return null;
        }
    }

}
