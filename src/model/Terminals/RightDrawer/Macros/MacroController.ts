import { makeAutoObservable } from 'mobx';
import { App } from 'src/model/App';
import { Macro } from './Macro';

export class MacroController {

  macrosArray: Macro[] = [];

  macroToDisplayInModal: Macro | null = null;

  isModalOpen: boolean = false;

  constructor(app: App) {

    // Create individual macros. These will be displayed in the right-hand drawer
    // in the terminal view.
    for (let i = 0; i < 3; i++) {
      this.macrosArray.push(new Macro(app, `M${i}`, ''));
    }

    makeAutoObservable(this); // Make sure this near the end
  }

  setMacroToDisplayInModal(macro: Macro) {
    console.log('Set macro to display in modal:', macro);
    this.macroToDisplayInModal = macro;
  }

  setIsModalOpen(isOpen: boolean) {
    console.log('Set isModalOpen:', isOpen);
    this.isModalOpen = isOpen;
  }

}
