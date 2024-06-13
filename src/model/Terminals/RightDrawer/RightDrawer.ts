import { makeAutoObservable } from 'mobx';
import { MacroController } from './Macros/MacroController';
import { App } from 'src/model/App';

export default class RightDrawer {

  macroController: MacroController;

  quickPortSetttingsIsExpanded = false;
  otherQuickSettingsIsExpanded = false;
  macrosIsExpanded = false;

  constructor(app: App) {

    this.macroController = new MacroController(app);

    makeAutoObservable(this); // Make sure this near the end
  }

  handleQuickPortSettingsAccordionChange =  (event: React.SyntheticEvent, isExpanded: boolean) => {
    this.quickPortSetttingsIsExpanded = isExpanded;
  };

  handleOtherQuickSettingsAccordionChange = (event: React.SyntheticEvent, isExpanded: boolean) => {
    this.otherQuickSettingsIsExpanded = isExpanded;
  };

  handleMacrosAccordionChange = (event: React.SyntheticEvent, isExpanded: boolean) => {
    this.macrosIsExpanded = isExpanded;
  };
}
