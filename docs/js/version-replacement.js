
function updateVersionNumber(versionNumber) {

    // Replace all occurrences of "X.X.X" with the actual version,
    // for all platforms

    var windowsLink = document.getElementById("windows-link");
    windowsLink.innerHTML = windowsLink.innerHTML.replace(/vX\.X\.X/g, versionNumber);
    windowsLink.href = windowsLink.href.replace(/vX\.X\.X/g, versionNumber);

    var macLink = document.getElementById("mac-link");
    macLink.innerHTML = macLink.innerHTML.replace(/vX\.X\.X/g, versionNumber);
    macLink.href = macLink.href.replace(/vX\.X\.X/g, versionNumber);

}