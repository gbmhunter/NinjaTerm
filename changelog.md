vX.X.X
------

- Updated release information on README for new Gradle build system, closes #195.
- Added link to JProfiler on homepage, closes #199.

v0.8.6
------

- Added script to install openjfx before main Linux installer runs, closes #186.
- Added installation steps for all platforms, closes #184.
- Fixed bug where 'Open' button on TX/RX tab is enabled when no COM ports can be found, closes #185.
- Removed manual buffer size limitations on totalNewLineParserOutput, closes #178.
- Fixed bug where WebView data pane labels where not being setup correctly on start-up, closes #187.
- Build system changed from Maven to Gradle.

v0.8.5
------

- Javascript is loaded via the `WebView.executeScript()` method, closes #183.
- Added Linux build, closes #181.

v0.8.4
------

- Updated ANSI escape sequence support .gif on home page, closes #180.
- Improved the way that WebView is found to be "ready", closes #182.

v0.8.3
------

- Fixed bug where "Scroll to bottom" functionality was being disabled automatically, closes #179.

v0.8.2
------

- Moved the "scroll to bottom" arrow slightly to the left so it does not block the scroll bar, closes #174.
- Removed the instruction to run `mvn assembly:single` from README, as it is not needed, closes #175.
- Improved the "About" dialogue, closes #172.
- Added LICENSE.txt to repo, closes #176.
- Added ability to prepend RX lines of data with the date/time, closes #126.

v0.8.1
------

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

v0.8.0
------

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

v0.7.2
------

- The "fat" .jar now retains the same name (NinjaTerm.jar) between different versions, and is the same name as before the maven integration, closes #147.

v0.7.1
------

- An empty new line pattern textfield now results in no new line markers being added, closes #139.
- All previously uncaught exceptions are caught in "main()" and a "Exception Occurred" pop-up is displayed to the user, closes #140.
- Added the GlythFont (FontAwesome) as a resource so that NinjaTerm does not need an internet connection to display the glyths, closes #138.
- When the buffer is full, TX/RX panes scroll so that the "viewing window" does not change, closes #141.
- Added scroll behaviour options to the "Display" pop-over (either smart scroll or standard scroll), closes #142.
- Added "build passing" and other stickers to the README and homepage, closes #145.
- Set max. char limits on all buffers, closes #146.
- Fixed bug where "Clear Text" button is not flushing all buffers, closes #144.

v0.7.0
------

- Added shortcut key to speed up splash screen (spacebar), closes #127.
- Moved "Open/Close" COM port button into area of UI which is accessible from any sub-tab, closes #135.
- Added a "Freeze RX" option to the TX/RX sub-tab, closes #132.
- Fixed bug where freeze RX data functionality did not work correctly with filtering, closes #136.
- Added ability to display non-printable characters on TX/RX panes (e.g. using special font), closes #134.

v0.6.4
------

- When the "Clear Text" button is pressed, the RX text now retains the previous formatting colour, closes #131.

v0.6.3
------

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

v0.6.2
------

- Created separate build configuration in IntelliJ to run without splash screen, so the boolean flag does not have to be changed on every release, closes #109.
- Instruction step to update version number on website added to readme, closes #111.
- Fixed bug where in "1-pane" mode, the caret does not remain at the end of the data when new data is received, closes #110.
- Fixed bug where "Local TX echo" does not work, closes #112.
- Added a "New Tab" button/tab to the end of row of tab headers, closes #104.
- Fixed bug where COM port was not closed if terminal tab was closed, closes #113.
- Fixed bug where COM port and it's thread were not closed if COM port was open when the application exits, closes #114.

v0.6.1
------

- Tab headers are now auto-renamed from COM? to COM1 (or equivalent) when COM port is opened, closes #106.
- Removed the unneeded "StatusBarController" variable from being passed into view controller constructors, closes #107.
- Added "Close" option to tab header context menu, closes #105.
- Refactored serial port open/close code and made sure disconnection cases are handled correctly, closes #108.

v0.6.0
------

- Added ability to select between "overwrite" and "append" logging methods, closes #99.
- Added option for user to choose termination character(s), closes #82.
- Added support for ANSI escape sequences (in particular, the colour codes), closes #100.
- Fixed bug where buffer limit was not being obeyed for the RX data when stored in ObservableList of Nodes, closes #101.
- Fixed bug where app crashes if com's is stopped and restarted with ASCII escape sequences due to unsupported escape sequences not being handled, closes #102.
- Improved filtering logic so it works alongside ANSI escape codes, closes #103.

v0.5.1
------

- Fixed bug where NinjaTerm would lock up on splash screen.

v0.5.0
------

- Added filter field in TX/RX sub-tab, closes #84.
- Fixed incorrect link to GitHub on homepage, closes #94.
- Fixed incorrect web page title on homepage, closes #93.
- TX and RX buffer sizes are now shown on stats sub-tab, closes #95.
- Fixed bug where build configurations were not being included in repo, closes #85.
- Added logging sub-tab and basic logging functionality, closes #96.
- Greyed out textfield and browse button on logging tab when logging is active, closes #97.

v0.4.1
------

- Fixed bug where splash-screen was disabled.

v0.4.0
------

- Added ability to rename terminal tabs, closes #92.

v0.3.0
------

- Added indicators to label the RX and TX panes, closes #91.

v0.2.0
------

- Changes to auto-update functionality.

v0.1.0
------

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