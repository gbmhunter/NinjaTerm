
function updateVersionNumber(versionNumber) {

    var windowsLink = document.getElementById("windows-link");

    // Replace all occurrences of "X.X.X" with the actual version
    windowsLink.innerHTML = windowsLink.innerHTML.replace(/vX\.X\.X/g, versionNumber);
    windowsLink.href = windowsLink.href.replace(/vX\.X\.X/g, versionNumber);

}