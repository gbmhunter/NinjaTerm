
function updateVersionNumber(versionNumber) {

    var windowsLink = getElementById("windows-link");

    // Replace all occurrences of "X.X.X" with the actual version
    windowsLink.innerHTML.replace(/vX\.X\.X/g, versionNumber)

}