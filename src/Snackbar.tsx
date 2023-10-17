import { makeAutoObservable } from 'mobx';
import { VariantType, enqueueSnackbar } from 'notistack';

export default class Snackbar {

  snackBarOpen: boolean;

  constructor() {
    this.snackBarOpen = false;
    makeAutoObservable(this); // Make sure this near the end
  };

  setSnackBarOpen(trueFalse: boolean) {
    this.snackBarOpen = trueFalse;
  }

  /**
   * Enqueues a message to the snackbar used for temporary status updates to the user.
   *
   * @param msg The message you want to display. Use "\n" to insert new lines.
   * @param variant The variant (e.g. error, warning) of snackbar you want to display.
   */
  sendToSnackbar(msg: string, variant: VariantType) {
    enqueueSnackbar(
      msg,
      {
        variant: variant,
        preventDuplicate: true, // Prevents duplicate messages from being displayed. This is useful for things like "break" errors from the serial port, many of these can occur in quick succession
        style: { whiteSpace: 'pre-line' } // This allows the new lines in the string above to also be carried through to the displayed message
      });
  }

}
