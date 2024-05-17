import { makeAutoObservable } from 'mobx';
import { Macros } from './Macros/Macros';

export default class RightDrawer {

  macros: Macros = new Macros();

  constructor() {

    makeAutoObservable(this); // Make sure this near the end
  }
}
