# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

## [4.20.1] - 2025-06-10

### Added

- Added a better "fake MCU" fake port to the app for testing/demoing.
- Adjusted SEO on homepage.

### Changed

- Changed all the GIFs on the homepage to WebM videos.

## [4.20.0] - 2025-06-07

### Added

- Added the ability to add timestamps to the start of each line of received data. Timestamps can be enabled from the Settings->RX Settings menu.
- Added the ability to select the default background, TX text and RX text colors from the Settings->Display menu. ANSI escape code colors commands will override these defaults. This also means you can color TX and RX text differently.
- Added a "Clear app data and reload app" button to the Settings->General Settings menu which clears all app data in local storage (e.g. profiles, settings changed from their defaults) and reloads the app.
- Added a local echo status indicator to the bottom toolbar.
- Added support for receiving tab characters and handling them correctly with tab stops.
- Added a small "Copy all text" button to each terminal which copies all the text in that terminal (including the scrollback buffer) to the clipboard.
- Added autoscroll lock on TX setting to the Settings->Display menu. When enabled (the default), the TX terminal and TX/RX terminals will automatically scroll to the bottom when the user presses a key inside the terminal.

### Changed

- Improved the way app data stored in the browser's local storage is updated to the latest version.
- Reordered the left-hand toolbar icons so that the "Show the terminal" button is now the first one.
- Made the logo in the left-hand toolbar a button which opens the terminal.

### Fixed

- Run unit tests (vitest) in CI after discovering they were not running.
- Fixed broken unit tests.
- Tooltip entry delay issues fixed in the quick settings accordion.

## [4.19.1] - 2025-05-31

### Fixed

- Removed Umami analytics to fix issue with app loading very slowly if Umami server was down (will revert to using Google Analytics from now on).
- Upgraded dependencies and GitLab CI action versions to fix broken build/CI process.

## [4.19.0] - 2024-06-30

### Added

- Added the ability to modify port settings whilst the port is open (port is quickly disconnected and reconnected with new settings).
- Added support for the ESC[1J, ESC[2J and ESC[3J "Erase in Display" ASCII escape codes (ESC[0J was already supported).
- Added a "Manual" page to the app, which contains the start of a user manual for NinjaTerm.
- Added unit tests to make sure app data in local storage can be upgraded correctly.

### Fixed

- Cosmetic cursor at the end of the blurb now blinks again on homepage.
- Removed a `.only()` from a test which was causing other tests to be skipped.
- Fixed broken tests in `SingleTerminal.spec.ts` by clearing local storage before each test.

### Changed

- Switched from a CJS to ESM build in vite. CJS build is deprecated. See https://vitejs.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated for more info.
- Cursor up escape codes cannot move the cursor up into the scrollback buffer to correctly emulate terminal behaviour.

## [4.18.0] - 2024-06-16

### Added

- Clicking on the many of the indicators in the bottom status bar takes you to the settings view where you can change the related settings.
- Added accordions to the terminal right-hand drawer, and added more controls such as quick port settings.
- The terminal right-hand drawer now remembers if it was open or closed. This info is also saved in each profile.
- Added to option to send a break signal on Enter key press.
- Added ability to send a break signal at the end of every line of hex data in a macro.
- ASCII macro data now adds the "on enter" sequence to the end of every line, if enabled.
- You can now disable "received break signal" warnings from the RX Settings view.
- The right-hand terminal drawer width is now saved as part of the application data and in profiles.

### Changed

- Improved the way app data is stored in local storage.
- Snackbar message when profile is loaded now tells you if already connected port matches the one specified in the profile.
- Active profile name is updated when the app state is saved to a profile.

### Fixes

- Fixes bug present in v4.17.x where the app would crash relatively often when navigating back to the terminal view from the settings view. This was due to some tooltips containing buttons that were sometimes disabled, without a wrapper div around them.

## [4.17.1] - 2024-06-11

### Changed

- Added more info about browser compatibility to the error message if navigator.serial is not available. Also added this same info to the homepage.

## [4.17.0] - 2024-05-31

### Added

- Added ability to select flow control type (none or hardware) in the serial port settings.
- Added tooltips to parameters in the serial port settings pane.
- Added "Send Break" button to the terminal right-hand drawer.
- Added profiles (and a profile settings view) so that the user can save and load different serial port configurations.

## [4.16.0] - 2024-05-19

### Added

- Added macros to send pre-defined ASCII or HEX sequences out the serial port.
- Added a right-hand panel to the terminal view and moved some UI elements there.

### Fixed

- Fixed bug which caused the wrong serial port config to be displayed in the bottom toolbar.

## [4.15.0] - 2024-05-14

### Added

- Added more recommended baud rate options.
- Added the ability to specify a custom baud rate.
- Added a circular progress modal which is shown when the port is opening.
- Added ability to customize what is sent (LF, CR, or CRLF) on enter key press.

### Fixed

- Fixed bug which meant app thought port opened successfully even when it didn't.

## [4.14.0] - 2024-05-12

### Added

- Added support for receiving and displaying numerical data types such as hex, uint8, uint16, float32, e.t.c.
- Added the ability to send a 200ms break signal by pressing Ctrl-Shift-B when the terminal is focused and the serial port open.

## [4.13.2] - 2024-03-26

### Added

- "port-open" events tracked by Umami.

### Changed

- Umami analytics script now downloaded in dev. mode but tracking disabled.

## [4.13.1] - 2024-03-26

### Added

- Umami analytics is now used (using the subdomain umami.mbedded.ninja and a Umami instance running on Amazon Lightsail). If this works out well Google Analytics will be removed.

## [4.13.0] - 2024-03-07

### Added

- Ability to select terminal text and the selection persist across re-renders of the terminal pane (e.g. when more data arrives).
- Copy/paste of terminal text with Ctrl-Shift-C and Ctrl-Shift-V. Copying is handled smartly with new lines only added when terminal row was not a result of wrapping from the previous line.
- Tip displayed on startup with potentially useful information about the app.
- Integration test to make sure changing the number of characters per row in the terminal works.

### Changed

- Refactored source code by splitting things into `model/` and `view/` directories.

## [4.12.2] - 2024-02-13

### Changed

- Added the ability to toggle scroll lock (not just lock but also unlock) using the on terminal button. Changed the button icons to lock symbols.

### Fixed

- Fixed bug which caused app to crash if you tried to change the Data View Configuration through the Settings->Display menu.
- Fixed a bug which caused scroll lock to incorrectly turn off on some computers.

## [4.12.1] - 2023-12-03

### Added

- Added support to capture Alt-<char> key presses and send the correct data across the serial port. Unfortunately some combinations like Alt-F are caught by the browser and not passed to NinjaTerm, so we can't respond to those.

### Fixed

- Fixed bug where Ctrl-A thru Z would not work properly if lowercase letters were used.

## [4.12.0] - 2023-11-26

### Added

- Added support for the Delete key, closes #297.
- Added customizable support for the Backspace key.
- Added support for Ctrl-A thru Z, closes #296.
- Scrolling to the bottom of the terminal locks the scroll, closes #300.
- Moving the scrollbar upwards in the Terminal pane breaks scroll lock, closes #267.
- Added cross to each toaster item so it can be closed immediately by user, closes #301.
- Added a note about banned directories to the Logging window.
- Added labels to each terminal showing their direction (e.g. "TX/RX", "TX", "RX").

### Fixed

- Fixed bug where colours where not being reset when the "Clear" button was pressed.

### Changed

- Tidied up file paths and removed some unused variables from the codebase.

## [4.11.0] - 2023-11-19

### Added

- Added ability to filter rows of terminal text.
- Added more unit tests for the terminals.
- Added new performance profile before adding Filtering capability.
- Added input to change the vertical row padding.
- Display settings now persist across app restarts.
- Added responsive buttons to the terminal, the now hide the text when on small screens.

### Fixed

- Improved the modularity of the SingleTerminal class by removing it's dependency on the entire App class. This makes it easier to unit test.

## [4.10.1] - 2023-11-13

### Fixed

- Fixed bug which caused fatal error in JS if app was opened after local storage was cleared.
- Fixed MobX console warning.

### Changed

- If no configs exist in the browser's local store, default-created config will be saved back to store even if no changes are made.
- Removed unneeded console.log messages.

## [4.10.0] - 2023-11-12

### Added

- Last serial port details and connection state are remembered across App reloads, and NinjaTerm can automatically reconnect to previously used serial port.
- Added ability for NinjaTerm to reopen serial port (when available) after unexpected closure.

### Fixed

- Fixed bug where NinjaTerm would not disconnect when a USB serial cable was removed, closes #289.

### Changed

- Google Analytics is now only initialized in production builds, to prevent things like Playwright e2e tests from spamming GA and skewing data.
- Refactored "ApplyableTextField" into it's own classes.
- All user input fields (e.g. text inputs) now "apply" their changes on either loss of focus or by pressing the Enter key, no "Apply" button is needed.

## [4.9.0] - 2023-11-05

### Added

- Added tooltips for the left toolbar clickable navigation icons.
- Added logging functionality.

### Changed

- Starting to use zod instead of validator.js for input validation. zod has a design which works well for custom input classes, and doesn't cause the same import errors when running in vitest.

## [4.8.0] - 2023-11-03

### Added

- Added glyphs to the Unicode PUA range of the NinjaTerm font to show control characters and hex codes.
- Added option in data processing settings to select whether to display control character glyphs or hex code glyphs.
- A new "Display" section in the Settings pane.
- Added more outlines around subsets of settings to visually group related things together.
- Added more unit tests for testing new line and carriage return behavior.

### Fixed

- Fixed issue where resizing the window (esp. making it smaller) caused the terminal to not resize correctly, closes #288.

### Changed

- Removed old unused files including the `assets_old` directory and `public/manifest.json`.

## [4.7.0] - 2023-10-29

### Added

- vitest has been setup for running unit tests (Playwright is still used for E2E tests).
- Added ability to configure cursor behavior when new line and carriage return characters are received.

### Fixed

- Fixed bug where fake port dialog could be opened by any key press, now only opened with 'f'.
- Fixed issue where sometimes loading the URL `/app` would cause a 404 by adding a redirect to the Netlify config file.

### Changed

- Service worked is now only registered when the URL /app is opened, which should allow for UI notifications when the app needs updating.
- The "Update available" snackbar has better coloured buttons.

## [4.6.6] - 2023-10-26

### Changed

- Version number bump to test PWA new content prompt.

## [4.6.5] - 2023-10-26

### Changed

- Changed the PWA register type from autoUpdate to prompt.
- Set the PWA inject register value to null.

## [4.6.4] - 2023-10-26

### Changed

- Version number bump to test PWA new content prompt.

## [4.6.3] - 2023-10-26

### Added

- Added snackbar display for when new app version is available.

## [4.6.2] - 2023-10-25

### Changed

- Version number bump to test PWA new content prompt.

## [4.6.1] - 2023-10-25

### Changed

- All e2e tests are now run using Playwright rather than RTL.
- Application is now built using Vite rather than Webpack.

## [4.6.0] - 2023-10-23

### Added

- Added ability to change terminal font size to both settings menu and terminal toolbar.
- Added dialog window for selecting fake serial ports (for testing and demos), along with a flexible fake port controller class. Press "f" on the port settings pane to open the dialog.
- Performance improvements when processing large amounts of RX data.
- Added some initial Playwright e2e tests.

### Changed

- Combined view and model files together into a single directory tree.
- Setting inputs can now apply on loss of focus or enter rather than a Submit button.
- Tidied up the way key presses are handled.
- Changed the "Clear Data" button icon from a cross to a trash can.
- Changed software license from MIT to GNU GPLv3.

### Fixed

- Fixed an issue regarding clipping in terminal with autoscroll.
- Fixed rendering glitch with scroll lock or in the middle of data with data being removed at the start (buffer is full) by replacing `useEffect()` with `useLayoutEffect()`.
- Fixed bug where new port could be selected while one is already opening, resulting in app crash when trying to use it.

## [4.5.2] - 2023-10-17

### Fixed

- Fixed bug where terminal font was too large.

## [4.5.1] - 2023-10-16

### Fixed

- Fixed bug where capital letters can't be sent in terminal, closes #275.

## [4.5.0] - 2023-10-15

### Added

- Added basic graphing functionality, closes #234.
- Added fake port easter egg for testing/demos. Press "d" when the serial port config. settings are visible.
- Added a function to make it easier to select options from MUI selects during testing.

### Changed

- Multiple snackbar messages of the same type are now suppressed. This helps when many of the same error occurs quickly, e.g. break errors from the serial port.

## [4.4.2] - 2023-10-09

### Added

- Added more info to README.
- Escape codes that are too long now push the parser back into IDLE state, closes #270. Added setting to select max. escape code length.

### Fixed

- Tab key now gets captured by the Terminal panes and HT char code sent, closes #263.
- Removed unused imports from Typescript files.
- RX terminals no longer behave like they can capture keystrokes, closes #269.
- Improved handling of a FramingError on read(), closes #259.

### Changed

- Rearranged folder structure of view components.
- Tooltips now follow the cursor around, improving usability in settings menu, closes #261.

## [4.4.1] - 2023-10-04

### Fixed

- Issue where text was actually still overflowing from one row to the next.

## [4.4.0] - 2023-10-03

### Added

- Terminal panes are now focusable. Border glow is shown when focused and cursor changes from an outline to a solid rectangle.
- Key presses are only interpreted as data to be sent to serial ports when terminal panes are focused.

### Fixed

- Fixed weird layout issues that were occurring in the Terminal pane(s) when data was present, closes #264.
- Fixed issue where text on a Terminal row overflows into the next one if the window width is too small, closes #262.

### Changed

- Simplified issue templates.

## [4.3.1] - 2023-10-01

### Added

- Added Google Analytics.

### Fixed

- Fixed nesting error of paragraph elements on the homepage.

## [4.3.0] - 2023-09-30

### Added

- Added support for pressed arrow keys to send to appropriate ANSI escape codes across port (for terminal emulation).
- Added RX support for ESC[nC commands (CUF - Cursor Forward).
- Added new homepage for NinjaTerm which is built into the app, rather than a separate site deployed to GitHub page.

### Fixed

- Fixed bug where "Space" and "Backspace" were not sending the correct data to the serial port, closes #256.
- Fixed issue with duplicate keys in view (on indicator elements).

## [4.2.0] - 2023-09-27

### Added

- Testing function which sets up the App with a mocked WebSerial API is working.
- Error message is now shown if user attempts to open already in-use port, closes #254.
- Smart scrolling when max. scrollback size is reached, auto-scroll occurs to keep the same data in view. 
- Added specific error handling for a BufferOverrunError.
- Easy to identify colour to the background of the port state in bottom statusbar.
- Added a margin between the outer edges of each terminal and the displayed text inside it.
- Flashing indicators added to the bottom status bar to indicate when TX or RX data is received.

### Fixed

- Test which checks written data is working again.
- Max. scrollback buffer size value now obeyed.
- Non-fatal errors such as a BufferOverrunError or BreakError keep the connection open.

## [4.1.0] - 2023-09-24

### Added

- Added a snackbar to display status messages to the user.
- NinjaTerm version number displayed in top-right of screen.
- Added shorthand serial port config. display in the bottom toolbar of app.
- Added logo to the app toolbar.
- Added a "Ko-Fi" donate button to the app toolbar.

### Changed

- Updated logo in README to use standard red theme colour.

### Fixed

- Fixed HTML page title from "React App" to "NinjaTerm".
- Fixed missing status information in the "Port Configuration" settings.
- App now correctly handles situation when user clicks the "Cancel" button in the serial port list.
- App now correctly handles situation when USB serial device is removed whilst connected.
- Num. data bits, parity and num. stop bits now being configured correctly in serial port.

## [4.0.0] - 2023-09-22

- Ported from NinjaTerm being an Electron app to a PWA (Progressive Web App).

## [3.2.1] - 2023-09-17

- Fixed rendering bug where window resizing would not properly adjust terminal panes.
- Fixed bug where TX data was not being displayed correctly in the terminals.
- Removed status message pane from the bottom of the app.

## [3.2.0] - 2023-09-16

- Cursor can now be moved back into previous text -- it is no longer stuck at the end of all the data. This allows for more ANSI escape code support.
- Only current view port of terminal is actually rendered in the DOM, providing better performance for large scrollback buffers.
- Added support for bright CSI SGR ANSI escape codes.
- Added support for the CSI codes that move the cursor up ([ESC][A), back ([ESC][D), and clear the screen from cursor to end of text ([ESC][J).
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

- Removed COM ports now disappear on rescan (when there are no COM ports available), closes #224.
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

[unreleased]: https://github.com/gbmhunter/NinjaTerm/compare/v4.20.1...HEAD
[4.20.1]: https://github.com/gbmhunter/NinjaTerm/compare/v4.20.0...v4.20.1
[4.20.0]: https://github.com/gbmhunter/NinjaTerm/compare/v4.19.1...v4.20.0
[4.19.1]: https://github.com/gbmhunter/NinjaTerm/compare/v4.19.0...v4.19.1
[4.19.0]: https://github.com/gbmhunter/NinjaTerm/compare/v4.18.0...v4.19.0
[4.18.0]: https://github.com/gbmhunter/NinjaTerm/compare/v4.17.1...v4.18.0
[4.17.1]: https://github.com/gbmhunter/NinjaTerm/compare/v4.17.0...v4.17.1
[4.17.0]: https://github.com/gbmhunter/NinjaTerm/compare/v4.16.0...v4.17.0
[4.16.0]: https://github.com/gbmhunter/NinjaTerm/compare/v4.15.0...v4.16.0
[4.15.0]: https://github.com/gbmhunter/NinjaTerm/compare/v4.14.0...v4.15.0
[4.14.0]: https://github.com/gbmhunter/NinjaTerm/compare/v4.13.2...v4.14.0
[4.13.2]: https://github.com/gbmhunter/NinjaTerm/compare/v4.13.1...v4.13.2
[4.13.1]: https://github.com/gbmhunter/NinjaTerm/compare/v4.13.0...v4.13.1
[4.13.0]: https://github.com/gbmhunter/NinjaTerm/compare/v4.12.2...v4.13.0
[4.12.2]: https://github.com/gbmhunter/NinjaTerm/compare/v4.12.1...v4.12.2
[4.12.1]: https://github.com/gbmhunter/NinjaTerm/compare/v4.12.0...v4.12.1
[4.12.0]: https://github.com/gbmhunter/NinjaTerm/compare/v4.11.0...v4.12.0
[4.11.0]: https://github.com/gbmhunter/NinjaTerm/compare/v4.10.1...v4.11.0
[4.10.1]: https://github.com/gbmhunter/NinjaTerm/compare/v4.10.0...v4.10.1
[4.10.0]: https://github.com/gbmhunter/NinjaTerm/compare/v4.9.0...v4.10.0
[4.9.0]: https://github.com/gbmhunter/NinjaTerm/compare/v4.8.0...v4.9.0
[4.8.0]: https://github.com/gbmhunter/NinjaTerm/compare/v4.7.0...v4.8.0
[4.7.0]: https://github.com/gbmhunter/NinjaTerm/compare/v4.6.5...v4.7.0
[4.6.5]: https://github.com/gbmhunter/NinjaTerm/compare/v4.6.4...v4.6.5
[4.6.4]: https://github.com/gbmhunter/NinjaTerm/compare/v4.6.3...v4.6.4
[4.6.3]: https://github.com/gbmhunter/NinjaTerm/compare/v4.6.2...v4.6.3
[4.6.2]: https://github.com/gbmhunter/NinjaTerm/compare/v4.6.1...v4.6.2
[4.6.1]: https://github.com/gbmhunter/NinjaTerm/compare/v4.6.0...v4.6.1
[4.6.0]: https://github.com/gbmhunter/NinjaTerm/compare/v4.5.2...v4.6.0
[4.5.2]: https://github.com/gbmhunter/NinjaTerm/compare/v4.5.1...v4.5.2
[4.5.1]: https://github.com/gbmhunter/NinjaTerm/compare/v4.5.0...v4.5.1
[4.5.0]: https://github.com/gbmhunter/NinjaTerm/compare/v4.4.2...v4.5.0
[4.4.2]: https://github.com/gbmhunter/NinjaTerm/compare/v4.4.1...v4.4.2
[4.4.1]: https://github.com/gbmhunter/NinjaTerm/compare/v4.4.0...v4.4.1
[4.4.0]: https://github.com/gbmhunter/NinjaTerm/compare/v4.3.1...v4.4.0
[4.3.1]: https://github.com/gbmhunter/NinjaTerm/compare/v4.3.0...v4.3.1
[4.3.0]: https://github.com/gbmhunter/NinjaTerm/compare/v4.2.0...v4.3.0
[4.2.0]: https://github.com/gbmhunter/NinjaTerm/compare/v4.1.0...v4.2.0
[4.1.0]: https://github.com/gbmhunter/NinjaTerm/compare/v4.0.0...v4.1.0
[4.0.0]: https://github.com/gbmhunter/NinjaTerm/compare/v3.2.1...v4.0.0
[3.2.1]: https://github.com/gbmhunter/NinjaTerm/compare/v3.2.0...v3.2.1
[3.2.0]: https://github.com/gbmhunter/NinjaTerm/compare/v3.1.0...v3.2.0
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
