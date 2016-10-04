package ninja.mbedded.ninjaterm.model;

import ninja.mbedded.ninjaterm.model.terminal.Terminal;

/**
 * Listener interface to objects that what to know when a terminal needs to be closed.
 *
 * Used to communicate from the model to the view controller that a terminal needs to be closed.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-10-04
 * @last-modified 2016-10-04
 */
public interface CloseTerminalListener {
    void run(Terminal terminal);
}
