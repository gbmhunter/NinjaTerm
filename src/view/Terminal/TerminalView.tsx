import { observer } from 'mobx-react-lite';

import { App } from 'model/App';
import Terminal from 'model/Terminal/Terminal';

interface Props {
  appStore: App;
  terminal: Terminal;
  testId: string;
}

export default observer((props: Props) => {
  return <div></div>
});
