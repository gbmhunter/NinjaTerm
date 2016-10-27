
NinjaTerm
=========

#### A serial port terminal that's got your back.

[![Travis](https://img.shields.io/travis/mbedded-ninja/NinjaTerm.svg)](https://travis-ci.org/mbedded-ninja/NinjaTerm)

[![Github All Releases](https://img.shields.io/github/downloads/mbedded-ninja/NinjaTerm/total.svg)](http://mbedded-ninja.github.io/NinjaTerm/)

[![Github Releases](https://img.shields.io/github/downloads/mbedded-ninja/NinjaTerm/latest/total.svg)](http://mbedded-ninja.github.io/NinjaTerm/)

- Author: gbmhunter <gbmhunter@gmail.com> (http://www.mbedded.ninja)
- Created: 2015-07-15
- Last Modified: 2016-10-17
- Version: v0.7.0
- Company: mbedded.ninja
- Project: NinjaTerm
- Language: Java, JavaFX
- Compiler: n/a
- uC Model: Any
- Computer Architecture: Any
- Operating System: Any
- Documentation Format: Doxygen
- License: GPLv3


Installation
============

See the [NinjaTerm homepage](http://mbedded-ninja.github.io/NinjaTerm/).

Developing
==========

1. Download/clone this repository into a folder on your computer (SourceTree with GitFlow plugin is recommended).
2. Make sure you have a 32-bit version of the JDK installed (must be at least JDK 8).
3. Download the community edition of Intellij IDEA (it's free!). Import the project in IntelliJ (`pom.xml` file included in repo). Select the JDK installed on your computer.
5. Make sure you are on the develop branch. Create a new branch from the head of the develop branch to create your new feature on.
6. Write code!
7. Build/run NinjaTerm by typing `mvn exec:java` (this will start NinjaTerm without the splash screen, for quicker debugging).
7. Commit and submit a pull-request when your feature is complete.

[Scene Builder](http://gluonhq.com/labs/scene-builder/) can be great tool to install alongside IntelliJ for faster development of the JavaFX UI.

Releasing New Version
=====================

NOTE: The order of the following tasks is important!

1. Make sure that you are on the `release` branch, and that desired updates have been merged from the feature branches.
1. Update changelog.md with a list of all changes since the last version, under a heading that is the new version number (e.g. "v0.4.0").
2. Update README.md with the new version number and "last changed" date.
3. Update the version number in `docs/index.html`. This is contained on the line `<body onload="updateVersionNumber('v0.4.0')">`. 
3. Update the version number in `pom.xml`, e.g. `<version>0.4.0</version>`.
3. Package the source code into a .jar file with external dependencies by running `mvn package` from the command line.
3. Build a "fat" .jar (all dependencies included) by running `mvn assembly:single` (make sure `mvn package` has been run first!).
4. Open NinjaTerm.install4j in the install4j GUI. Update the version number on the "General Settings" tab.
5. Click "Save Project" and then "Build Project".
6. Once the installers have been created, overwrite the "updates.xml" in the repo root directory with the one from the install/ directory.
7. Commit these changes on the "release" branch (you should already be on this branch).
8. Switch to the "master" branch and merge the "release" branch into it. Make sure to create a new commit (click the "Create new commit even if fast forward possible" checkbox if using the SourceTree GUI).
9. Add a tag to this new commit on the master branch, tagging it with the version number (e.g. "v0.4.0").
10. Go to the GitHub repo's main page and click "Releases".
11. Click "Draft a new release". Create a new release, using "0.4.0" as both the tag and the title. Populate the description box with the same info that was added to changelog.md.
12. Upload the installers that install4j has created in the "install/" directory.
13. Click "Create new release", and it is all done!
 

File/Package Structure 
======================

NinjaTerm uses a MVC-style architecture which is reflected in the folder/package structure.

src/
----

Contains the source code. The code is further placed in the sub-directories `/ninja/mbedded/ninjaterm` as to follow standard Java practise.

Then there are the following sub-directories:

| Directory    | Description                                                                                                                 |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| model        | The model for the application. This contains all the business logic (where most of the programs logic resides). Classes in here are not aware of the view.            |                               |
| resources    | Contains things such as images and CSS files.                                                                               |
| util         | Contains many utility classes that are used through-out the model and the view controllers.                                                |
| view         | Contains the .fxml files and their controllers which describe sections of the UI. For each .fxml file there is also one controller. The model is injected into the view controllers.  |

`Interfaces` are not placed in their own directory, but rather placed in the same package/folder that contains the classes most relevant (for a `Interface` class that is being used to implement the Observer pattern, this would be in the same package as the class which fires the event).

Debugging
=========

Debug output from NinjaTerm can be enabled by providing the `debug` command-line argument when starting the program. This can be done by opening up a command-line window/shell in the same directory as the .jar file (on Windows this is located in a directory similar to `C:\Program Files (x86)\NinjaTerm`. Then start NinjaTerm with the following command:

`java -jar NinjaTerm.jar debug`

This will instruct NinjaTerm to output debug information to your default user directory (on Windows this is `C:\Users\<your user name>\`. The file name should be in the format `NinjaTerm-<DATE>-DEBUG.log`.

You can also use the command-line parameter `no-splash` to stop the splash-screen from running. This can be useful for speeding things up when debugging.


Changelog
=========

See changelog.md.

Contributors
============

See the [NinjaTerm homepage](http://mbedded-ninja.github.io/NinjaTerm/).