
NinjaTerm
=========

#### A serial port terminal that's got your back.


- Author: gbmhunter <gbmhunter@gmail.com> (http://www.mbedded.ninja)
- Created: 2015-07-15
- Last Modified: 2016-10-03
- Version: v0.6.0
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