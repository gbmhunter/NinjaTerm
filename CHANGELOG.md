# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

- Cursor can now be moved back into previous text -- it is no longer stuck at the end of all the data. This allows for more ANSI escape code support.
- Only current view port of terminal is actually rendered in the DOM, providing better performance for large scrollback buffers.
- Added support for bright CSI SGR ANSI escape codes.
- Added support for the CSI codes that move the cursor back, forwards, up and down.
- Added integration tests which test the entire application. A mock serial port is created, jest is used to simulated mouse clicks and connect to the port, fake data is inserted into the serial port and the render is checked to make sure the correct result is displayed.
- Terminal max. width is working correctly now.
- Datetimes in status bar are now shown in local time zone, not UTC.

## [3.1.0] - 2023-08-28

- Fixed broken links to GitHub tags in this CHANGELOG.
- Created `staging` branch which the GitHub publish action runs from.
- The ANSI escape code parsing and text colouring is now working again.
- Added new settings sub-category for data processing settings, which includes data display width and scroll-back buffer size settings.
- Added 3 separate view configurations to choose from (including combined and split TX/RX views).

## [3.0.0] - 2023-08-21

- Upgraded electron-react-boilerplate code to latest version.
- Changed NinjaTerm to a dark theme.
- Added GitHub Action for generating release artifacts and creating GitHub release.
- The serial port settings dialog now shows more information about each serial port.

## [2.2.0] - 2021-01-04

- Added support for all common baud rates.
- Added support and validation for custom baud rates.
- Typescript compiler now recognizes imports of CSS/SCSS files into `.tsx` files.

## [2.1.0] - 2021-01-03

- NinjaTerm is now built for Linux.
- GitHub actions configured to build both Windows and Linux application images and release them to GitHub.

## [2.0.0] - 2021-01-02

- Application now built with Electron/Javascript/React rather than Java/JavaFX.
- Windows executable available.
- GitHub actions is used for CICD instead of TravisCI.
- GitHub actions runs both tests and builds production images (which are released automatically to GitHub).
- Basic serial port functionality has been ported across from the Java app.

## [1.1.2] - 2020-11-01

### Fixed

- Fixed the 404 not found error with the link on the About page.

## [1.1.1] - 2019-04-14

### Added

- Java is now bundled with the Windows and Mac installers.

### Fixed

- Broken URLs on homepage.

## [1.1.0] - 2018-11-12

### Added

- Process and system CPU load is now displayed at the bottom of the NinjaTerm UI (useful to know at faster baud rates).

### Fixed

- Removed logger messages from CPU intensive data RX loop.

## [1.0.0] - 2018-11-12

### Added

- Added font-size and text/background colour pickers to style the TX/RX data, closes #163.
- Updated example .gif files on home page.

### Fixed

- Removed COM ports now dissappear on rescan (when there are no COM ports available), closes #224.
- Fixed bug where tab characters were not being displayed correctly on screen, closes #211.

## [0.9.1] - 2018-10-31

### Added

- NinjaTerm now supports custom (non-standard) baud rates (as long as the underlying OS/hardware also supports it), closes #222.

## [0.9.0] - 2018-05-17

### Changed

- COM data panes are now rendered using a RichTextFX element, rather than a web renderer, which was causing issues on Linux systems.
- Updated the NinjaTerm logo (thanks to utopian for creating the new one!).

## [0.8.12] - 2017-10-12

- Fixed bug where exception 'ReferenceError: Can't find variable: numCharsToRemove' was being thrown when a large number of chars were sent to NinjaTerm, closes #215.
- Fixed bug where wrapping did not work in RX or TX frames, closes #216.

## [0.8.11] - 2017-10-10

- Fixed bug where NinjaTerm freezes on splash screen when running .exe in Windows, closes #212.
- Removed incorrect 'Downloads 0' image from README, closes #214.

## [0.8.10] - 2017-10-09

- Fixed bug where clicking the 'Clear Text' button then stopped TX text from being displayed, closes #210.

## [0.8.9] - 2017-02-21

- Added short note to top of homepage about NinjaTerm requiring Java, closes #204.
- Changed "nix" naming to "UNIX", closes #205.
- The currently selected sub-tab headers now indicate which tab is selected, closes #98.
- Converted buttons on TX/RX pane into accordion style UI, closes #206.
- Enlarges on start-up to full-screen size, closes #207.

## [0.8.8] - 2017-02-12

- Fixed bug where COM port settings where not being disabled once COM port was opened, closes #201.
- Added ability to update version number with gradle task, closes #202.
- Install4j installers can now be built with Gradle script, closes #203.

## [0.8.7] - 2017-02-08

- Updated release information on README for new Gradle build system, closes #195.
- Added link to JProfiler on homepage, closes #199.
- Added Java/JavaFX version check when app starts, closes #200.
- Made the macro side-bar resizeable, closes #196.
- Added info that if you have an existing version, you can just run it to update NinjaTerm, closes #192.
- Added "always on top" feature to NinjaTerm application window, closes #143.

## [0.8.6] - 2017-02-06

- Added script to install openjfx before main Linux installer runs, closes #186.
- Added installation steps for all platforms, closes #184.
- Fixed bug where 'Open' button on TX/RX tab is enabled when no COM ports can be found, closes #185.
- Removed manual buffer size limitations on totalNewLineParserOutput, closes #178.
- Fixed bug where WebView data pane labels where not being setup correctly on start-up, closes #187.
- Build system changed from Maven to Gradle.

## [0.8.5] - 2016-11-30

- Javascript is loaded via the `WebView.executeScript()` method, closes #183.
- Added Linux build, closes #181.

## [0.8.4] - 2016-11-30

- Updated ANSI escape sequence support .gif on home page, closes #180.
- Improved the way that WebView is found to be "ready", closes #182.

## [0.8.3] - 2016-11-29

- Fixed bug where "Scroll to bottom" functionality was being disabled automatically, closes #179.

## [0.8.2] - 2016-11-27

- Moved the "scroll to bottom" arrow slightly to the left so it does not block the scroll bar, closes #174.
- Removed the instruction to run `mvn assembly:single` from README, as it is not needed, closes #175.
- Improved the "About" dialogue, closes #172.
- Added LICENSE.txt to repo, closes #176.
- Added ability to prepend RX lines of data with the date/time, closes #126.

## [0.8.1] - 2016-11-24

- Fixed bug where default colour setting for ComDataPaneWeb was not working, closes #165.
- Brightened the default data colour, closes #162.
- Fixed bug where when the clear buffer button was pressed, text colour did not reset to the default, closes #166.
- Made "clear" remove both RX and TX data (previously only removed RX data), closes #161.
- Fixed bug where TX pane was being populated with data when COM port was closed, closes #167.
- Removed scroll behaviour options from "Display" pop-up (no longer needed), closes #168.
- Moved the "send" options from display pop-up to the formatting pop-up, closes #154.
- Renamed "Buffer Sizes" to "Screen Buffer Sizes", closes #169.
- Fixed bug where screen buffer size stats where not being updated, closes #170.
- Added a proper command-line argument parsing tool, closes #173.

## [0.8.0] - 2016-11-22

- Added blurb on smart scrolling to homepage, closes #148.
- Added first application test, closes #149.
- Created a "ComPortFactory" which returns mocked "ComPort" objects, which are then injected into the model, closes #151.
- Made the division of space for TX and RX modifiable (e.g. through a drag mechanism), closes #150.
- Added the ability to the user to specify text sequences to send to the COM port (macros), closes #155.
- Converted the "Macro Settings" window into a "Macro Manager" window, closes #157.
- Macro name is automatically generated when a new macro is added, closes #158.
- Fixed bug where macro manager left-hand side list text did not update when the macro name was updated, closes #160.
- Fixed bug where macro pane got squashed when TX/RX text extended of the end of the text view, closes #159.
- Added basic copy/paste support, closes #133.

## [0.7.2] - 2016-10-28

- The "fat" .jar now retains the same name (NinjaTerm.jar) between different versions, and is the same name as before the maven integration, closes #147.

## [0.7.1] - 2016-10-28

- An empty new line pattern textfield now results in no new line markers being added, closes #139.
- All previously uncaught exceptions are caught in "main()" and a "Exception Occurred" pop-up is displayed to the user, closes #140.
- Added the GlythFont (FontAwesome) as a resource so that NinjaTerm does not need an internet connection to display the glyths, closes #138.
- When the buffer is full, TX/RX panes scroll so that the "viewing window" does not change, closes #141.
- Added scroll behaviour options to the "Display" pop-over (either smart scroll or standard scroll), closes #142.
- Added "build passing" and other stickers to the README and homepage, closes #145.
- Set max. char limits on all buffers, closes #146.
- Fixed bug where "Clear Text" button is not flushing all buffers, closes #144.

## [0.7.0] - 2016-10-18

- Added shortcut key to speed up splash screen (spacebar), closes #127.
- Moved "Open/Close" COM port button into area of UI which is accessible from any sub-tab, closes #135.
- Added a "Freeze RX" option to the TX/RX sub-tab, closes #132.
- Fixed bug where freeze RX data functionality did not work correctly with filtering, closes #136.
- Added ability to display non-printable characters on TX/RX panes (e.g. using special font), closes #134.

## [0.6.4] - 2016-10-12

- When the "Clear Text" button is pressed, the RX text now retains the previous formatting colour, closes #131.

## [0.6.3] - 2016-10-12

- Moved decoding options to formatting popover, closes #116.
- Added icon to colouriser button, closes #115.
- "Parse ANSI escape sequences" checkbox is now only enabled when decoding mode is ASCII, closes #117.
- Fixed bug where ANSI escape codes were not disabled when it's checkbox is deselected, closes #119.
- Added bits/second metrics to the "Stats" sub-tab, closes #120.
- Added bottom bar to the status pane which displays the total TX/RX bytes per second rates, closes #122.
- Moved interface files from "interfaces/" and into the package/folder that they have most relevance with, closes #121.
- Added total TX/RX byte counts to the bottom status bar, closes #123.
- Added maximum flash rate functionality to the LED indicators, closes #118.
- Added ability for logging engine to "swallow" ANSI escape codes, closes #125.
- Added better debug logging facilities, closes #129.
- Added ability to log debug data to file via "debug" flag, closes #130.

## [0.6.2] - 2016-10-07

- Created separate build configuration in IntelliJ to run without splash screen, so the boolean flag does not have to be changed on every release, closes #109.
- Instruction step to update version number on website added to readme, closes #111.
- Fixed bug where in "1-pane" mode, the caret does not remain at the end of the data when new data is received, closes #110.
- Fixed bug where "Local TX echo" does not work, closes #112.
- Added a "New Tab" button/tab to the end of row of tab headers, closes #104.
- Fixed bug where COM port was not closed if terminal tab was closed, closes #113.
- Fixed bug where COM port and it's thread were not closed if COM port was open when the application exits, closes #114.

## [0.6.1] - 2016-10-06

- Tab headers are now auto-renamed from COM? to COM1 (or equivalent) when COM port is opened, closes #106.
- Removed the unneeded "StatusBarController" variable from being passed into view controller constructors, closes #107.
- Added "Close" option to tab header context menu, closes #105.
- Refactored serial port open/close code and made sure disconnection cases are handled correctly, closes #108.

## [0.6.0] - 2016-10-04

- Added ability to select between "overwrite" and "append" logging methods, closes #99.
- Added option for user to choose termination character(s), closes #82.
- Added support for ANSI escape sequences (in particular, the colour codes), closes #100.
- Fixed bug where buffer limit was not being obeyed for the RX data when stored in ObservableList of Nodes, closes #101.
- Fixed bug where app crashes if com's is stopped and restarted with ASCII escape sequences due to unsupported escape sequences not being handled, closes #102.
- Improved filtering logic so it works alongside ANSI escape codes, closes #103.

## [0.5.1] - 2016-09-23

- Fixed bug where NinjaTerm would lock up on splash screen.

## [0.5.0] - 2016-09-23

- Added filter field in TX/RX sub-tab, closes #84.
- Fixed incorrect link to GitHub on homepage, closes #94.
- Fixed incorrect web page title on homepage, closes #93.
- TX and RX buffer sizes are now shown on stats sub-tab, closes #95.
- Fixed bug where build configurations were not being included in repo, closes #85.
- Added logging sub-tab and basic logging functionality, closes #96.
- Greyed out textfield and browse button on logging tab when logging is active, closes #97.

## [0.4.1] - 2016-09-22

- Fixed bug where splash-screen was disabled.

## [0.4.0] - 2016-09-22

- Added ability to rename terminal tabs, closes #92.

## [0.3.0] - 2016-09-22

- Added indicators to label the RX and TX panes, closes #91.

## [0.2.0] - 2016-09-21

- Changes to auto-update functionality.

## [0.1.0] - 2016-09-21

- Automatic scan for COM ports performed on startup of app, closes #72.
- Added ability to have multiple terminals open within the same NinjaTerm application window, closes #73.
- "Busy COM port" error is now handled correctly, closes #74.
- Added flashing caret to end of terminal text.
- Added "Exit" item to "File" menu, closes #75.
- Changed colour of open/close button so that it is green/red, and added play/stop icons, closes #76.
- Added ability to send characters to COM port, closes #77.
- Added local echo option for TX characters, closes #78.
- Added statistics sub-tab, closes #79.
- Added flashing TX/RX activity indicators, closes #80.
- Added layout options for RX/TX tab, closes #81.
- Changed the "UTF-8" decoding option to "ASCII", closes #83.
- Added buffer limit for TX and RX data, closes #86.
- Added auto-scroll to status message pane, closes #87.
- Wrapping width textfield is greyed out when wrapping is disabled, closes #88.
- Added auto-scroll to TX pane, closes #89.
- Added special delete behaviour for backspace button when in "send on enter" mode, closes #90.

[unreleased]: https://github.com/gbmhunter/NinjaTerm/compare/v3.1.0...HEAD
[3.1.0]: https://github.com/gbmhunter/NinjaTerm/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/gbmhunter/NinjaTerm/compare/v2.2.0...v3.0.0
[2.2.0]: https://github.com/gbmhunter/NinjaTerm/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/gbmhunter/NinjaTerm/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/gbmhunter/NinjaTerm/compare/v1.1.2...v2.0.0
[1.1.2]: https://github.com/gbmhunter/NinjaTerm/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/gbmhunter/NinjaTerm/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/gbmhunter/NinjaTerm/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/gbmhunter/NinjaTerm/compare/v0.9.1...v1.0.0
[0.9.1]: https://github.com/gbmhunter/NinjaTerm/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/gbmhunter/NinjaTerm/compare/v0.8.12...v0.9.0
[0.8.12]: https://github.com/gbmhunter/NinjaTerm/compare/v0.8.11...v0.8.12
[0.8.11]: https://github.com/gbmhunter/NinjaTerm/compare/v0.8.10...v0.8.11
[0.8.10]: https://github.com/gbmhunter/NinjaTerm/compare/v0.8.9...v0.8.10
[0.8.9]: https://github.com/gbmhunter/NinjaTerm/compare/v0.8.8...v0.8.9
[0.8.8]: https://github.com/gbmhunter/NinjaTerm/compare/v0.8.7...v0.8.8
[0.8.7]: https://github.com/gbmhunter/NinjaTerm/compare/v0.8.6...v0.8.7
[0.8.6]: https://github.com/gbmhunter/NinjaTerm/compare/v0.8.5...v0.8.6
[0.8.5]: https://github.com/gbmhunter/NinjaTerm/compare/v0.8.4...v0.8.5
[0.8.4]: https://github.com/gbmhunter/NinjaTerm/compare/v0.8.3...v0.8.4
[0.8.3]: https://github.com/gbmhunter/NinjaTerm/compare/v0.8.2...v0.8.3
[0.8.2]: https://github.com/gbmhunter/NinjaTerm/compare/v0.8.1...v0.8.2
[0.8.1]: https://github.com/gbmhunter/NinjaTerm/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/gbmhunter/NinjaTerm/compare/v0.7.2...v0.8.0
[0.7.2]: https://github.com/gbmhunter/NinjaTerm/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/gbmhunter/NinjaTerm/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/gbmhunter/NinjaTerm/compare/v0.6.4...v0.7.0
[0.6.4]: https://github.com/gbmhunter/NinjaTerm/compare/v0.6.3...v0.6.4
[0.6.3]: https://github.com/gbmhunter/NinjaTerm/compare/v0.6.2...v0.6.3
[0.6.2]: https://github.com/gbmhunter/NinjaTerm/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/gbmhunter/NinjaTerm/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/gbmhunter/NinjaTerm/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/gbmhunter/NinjaTerm/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/gbmhunter/NinjaTerm/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/gbmhunter/NinjaTerm/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/gbmhunter/NinjaTerm/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/gbmhunter/NinjaTerm/releases/tag/v0.1.0
