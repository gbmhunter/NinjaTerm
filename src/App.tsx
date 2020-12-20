import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import SerialPort from 'serialport';

interface IProps {}

interface HelloState {
  serialPortInfos: SerialPort.PortInfo[];
}

class Hello extends React.Component<IProps, HelloState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      serialPortInfos: [],
    };
  }

  componentDidMount() {
    console.log(SerialPort);
    SerialPort.list()
      .then((portInfo) => {
        this.setState({
          serialPortInfos: portInfo,
        });
        return true;
      })
      .catch((reason) => {
        throw Error(`ERROR: ${reason}`);
      });
  }

  render() {
    const { serialPortInfos } = this.state;
    const serialPortInfoRows = serialPortInfos.map((serialPortInfo) => {
      return (
        <tr key={serialPortInfo.path}>
          <td>{serialPortInfo.path}</td>
          <td>{serialPortInfo.manufacturer}</td>
          <td>{serialPortInfo.locationId}</td>
        </tr>
      );
    });

    return (
      <div>
        <h1>NinjaTerm</h1>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h3>COM Ports</h3>
          <table className="left-align">
            <thead>
              <tr>
                <th>Path</th>
                <th>Manufacturer</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>{serialPortInfoRows}</tbody>
          </table>
          <button type="button" style={{ width: '200px' }}>
            Open
          </button>
        </div>
      </div>
    );
  }
}

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={Hello} />
      </Switch>
    </Router>
  );
}
