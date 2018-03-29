<p align="center"><img src="logo/logo.png" alt="NinjaTerm" height="200px"></p>

NinjaTerm
=========

#### A serial port terminal that's got your back.

[![Travis](https://img.shields.io/travis/mbedded-ninja/NinjaTerm.svg)](https://travis-ci.org/mbedded-ninja/NinjaTerm) [![Github All Releases](https://img.shields.io/github/downloads/mbedded-ninja/NinjaTerm/total.svg)](http://mbedded-ninja.github.io/NinjaTerm/)

- Maintainer/Primary Author: Geoffrey Hunter <gbmhunter@gmail.com> (http://www.mbedded.ninja)
- Created: 2015-07-15
- Last Modified: 2017-10-08
- Version: v0.8.12
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

1. Fork repo, then download/clone this repository into a folder on your computer, and make a new `feature/xxx` or `bug/xxx` branch.
2. Make sure you have a 32-bit version of the JDK installed (must be at least JDK 8).
3. Download the community edition of Intellij IDEA (it's free!). Load the project using the provided IntelliJ files. Select the JDK installed on your computer.
5. Make sure you are on the develop branch. Create a new branch from the head of the develop branch to create your new feature on.
6. Write code!
7. Build/run NinjaTerm by running the "run-dev" build config (this will start NinjaTerm without the splash screen, for quicker debugging).
7. Commit and submit a pull-request when your feature is complete.

[Scene Builder](http://gluonhq.com/labs/scene-builder/) can be great tool to install alongside IntelliJ for faster development of the JavaFX UI.

Releasing New Version
=====================

*NOTE: The order of the following tasks is important!*

**UPDATING VERSION NUMBER**

1. Make sure that you are on the `develop` branch, and that desired updates have been merged from the feature branches (this project uses the merge-merge workflow, not the rebase-merge workflow).
1. Update changelog.md with a list of all changes since the last version, under a heading that is the new version number (e.g. "v0.4.0").
1. Update the version number near the top of the `build.gradle` file, e.g. `version = '0.4.0`.
1. Run the command `gradle updateVersion` to update the version number in appropriate places in the repo. It will update the version number in `README.md` and `docs/index.html`.

**PACKAGING**

1. Package the source code into a .jar file with external dependencies AND then a "fat" .jar by running `gradle fatJar` from the command line. These should be placed in `build/libs`, with the fat jar having no version appended to it's filename.
1. Build the installer with the command `gradle media`. This will invoke install4j and build installers for Windows, Linux and Mac OSX. Note that the install4j program must be available on your computer for this step to work.
1. Once the installers have been created, overwrite the `updates.xml` in the repo root directory with the one from the install/ directory. This file informs NinjaTerm that a new version is ready when automatic update checking occurs on startup.
1. Commit these changes on the `develop` branch (you should already be on this branch). There should be 5 files which have changed.

**RELEASING TO MASTER AND GITHUB**

1. Switch to the `master` branch and merge the `develop` branch into it. Make sure to create a new commit (use the `git merge` option `--no-ff` from the command-line, or click the "Create new commit even if fast forward possible" checkbox if using the SourceTree GUI).
1. Add a tag to this new commit on the `master` branch, tagging it with the version number (e.g. "v0.4.0").
1. Go to the GitHub repo's main page and click "Releases".
1. Click "Draft a new release". Create a new release, using "0.4.0" as both the tag and the title. Populate the description box with the same info that was added to changelog.md.
1. Upload the installers that install4j has created in the `install/` directory.
1. Click "Create new release", and it is all done!
 

File/Package Structure 
======================

NinjaTerm uses the standard Maven/Gradle folder layout for Java projects. Inside the source code folders, MVC-style architecture is used which is reflected in the folder/package structure.

src/main/java/
--------------

Contains the source code. The code is further placed in the sub-directories `/ninja/mbedded/ninjaterm` as to follow standard Java namespace practises.

Then there are the following sub-directories:

| Directory    | Description                                                                                                                 |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| model        | The model for the application. This contains all the business logic (where most of the programs logic resides). Classes in here are not aware of the view.            |                               |
| resources    | Contains things such as images and CSS files.                                                                               |
| util         | Contains many utility classes that are used through-out the model and the view controllers.                                                |
| view         | Contains the .fxml files and their controllers which describe sections of the UI. For each .fxml file there is also one controller. The model is injected into the view controllers.  |

`Interfaces` are not placed in their own directory, but rather placed in the same package/folder that contains the classes most relevant (for a `Interface` class that is being used to implement the Observer pattern, this would be in the same package as the class which fires the event).

src/test/java/
--------------

Contains unit tests and integration tests. The sub-folders inside here follow the same layout as `src/main/java/`.

Command-Line Arguments
======================

Command-line arguments can be provided by opening up a command-line window/shell in the same directory as the .jar file (on Windows this is located in a directory similar to `C:\Program Files (x86)\NinjaTerm`.

Then start NinjaTerm in the following manner:

`java -jar NinjaTerm.jar <command-line arguments go here>`

| Option       | Description                             | Comments                                 |
|--------------|-----------------------------------------|------------------------------------------|
| `--logc`     | Prints debug data to the console.       | Prints the debug data to `stdout`. This will typically be the terminal you started the process with. |
| `--logf`     | Prints debug data to a file.            | This will instruct NinjaTerm to output debug information to your default user directory (on Windows this is `C:\Users\<your user name>\`. The file name should be in the format `NinjaTerm-<DATE>-DEBUG.log`. |
| `--nosplash` | Disables the splash screen.             | NinjaTerm loads straight the main window. This is useful for debugging, or if you are are getting impatient with the pretty animations. |

Changelog
=========

See changelog.md.

Contributors
============

See the [NinjaTerm homepage](http://mbedded-ninja.github.io/NinjaTerm/).
