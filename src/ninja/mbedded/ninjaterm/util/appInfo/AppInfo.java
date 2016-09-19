package ninja.mbedded.ninjaterm.util.appInfo;

import com.install4j.api.ApplicationRegistry;

/**
 * Created by gbmhu on 2016-09-19.
 */
public class AppInfo {

    /**
     * Retrieves the version number of the app, as defined by install4j when the installer was created.
     * Returns null if a version number can't be found.
     * @return The version number, as a string. Returns null if a version number can't be found.
     */
    public static String getVersionNumber() {
        // Get version number using install3j runtime API
        ApplicationRegistry.ApplicationInfo[] applicationInfo;

        try {
            applicationInfo = ApplicationRegistry.getApplicationInfoById("7231-2225-0472-1196");
        } catch (UnsatisfiedLinkError e) {
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
