import { makeAutoObservable } from 'mobx';
import { MacroController } from './Macros/MacroController';
import { App } from 'src/model/App';

export default class RightDrawer {

  macroController: MacroController;

  constructor(app: App) {

    this.macroController = new MacroController(app);

    makeAutoObservable(this); // Make sure this near the end
  }
}
