
NinjaTerm
=========

#### A serial port terminal that's got your back.


- Author: gbmhunter <gbmhunter@gmail.com> (http://www.mbedded.ninja)
- Created: 2015-07-15
- Last Modified: 2016-10-12
- Version: v0.6.3
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
3. Download the community edition of Intellij IDEA (it's free!). Open the project in IntelliJ (`NinjaTerm.iml` file included in repo).
4. In IntelliJ, open the project settings, and point the projects JDK to the installed version on your computer.
5. Make sure you are on the develop branch. Create a new branch from the head of the develop branch to create your new feature on.
6. Write code!
7. Commit and submit a pull-request when your feature is complete.

[Scene Builder](http://gluonhq.com/labs/scene-builder/) can be great tool to install alongside IntelliJ for faster development of the JavaFX UI.

Releasing New Version
=====================

NOTE: The order of the following tasks is important!

1. Make sure that you are on the "release" branch, and that desired updates have been merged from the feature branches.
1. Update changelog.md with a list of all changes since the last version, under a heading that is the new version number (e.g. "v0.4.0").
2. Update README.md with the new version number and "last changed" date.
3. Update the version number in `docs/index.html`. This is contained on the line `<body onload="updateVersionNumber('v0.4.0')">`. 
3. Build the .jar artifact by clicking Build->Build Artifacts in IntelliJ.
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
 

File Structure 
==============



src/
----

Contains the source code. The code is further placed in the sub-directories `/ninja/mbedded/ninjaterm` as to follow standard Java practise.

Then there are the following sub-directories:

| Directory    | Description                                                                                                                 |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| controllers  | Contains the Java classes that act as controllers for the `.fxml` views in `view/`.                                         |
| interfaces   | Contains interfaces for classes which implement the Observer pattern to communicate events.                                 |
| resources    | Contains things such as images and CSS files.                                                                               |
| util         | Contains non-view specific Java classes that are used by the controllers.                                                   |
| view         | Contains the .fxml files which describe sections of the UI. For each .fxml file there is a controller in `controllers/`.    |


Code Dependencies
=================



Changelog
=========

See changelog.md.

Contributors
============

See the [NinjaTerm homepage](http://mbedded-ninja.github.io/NinjaTerm/).