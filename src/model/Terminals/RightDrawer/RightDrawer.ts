import { makeAutoObservable } from 'mobx';
import { Macros } from './Macros/Macros';
import { App } from 'src/model/App';

export default class RightDrawer {

  macros: Macros;

  constructor(app: App) {

    this.macros = new Macros(app);

    makeAutoObservable(this); // Make sure this near the end
  }
}
