package ninja.mbedded.ninjaterm.model;

import javafx.beans.property.IntegerProperty;
import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.value.ObservableIntegerValue;
import ninja.mbedded.ninjaterm.model.globalStats.GlobalStats;
import ninja.mbedded.ninjaterm.model.terminal.Terminal;

import java.util.ArrayList;
import java.util.List;

/**
 * Model for the NinjaTerm application.
 *
 * This contains all of the app data and state. This drives
 * the view.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-09-16
 * @last-modified 2016-09-16
 */
public class Model {

    public List<Terminal> terminals = new ArrayList<>();

    public GlobalStats globalStats = new GlobalStats();

    public Model() {

    }

}
