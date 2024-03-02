import { getChildNodeIndex } from './Util';

/**
 * Represents a selection (click and dragged selected text) in a terminal pane.
 */
export default class SelectionInfo {
  anchorRowId: string;
  anchorSpanIndexInRow: number;
  anchorOffset: number;
  focusRowId: string;
  focusSpanIndexInRow: number;
  focusOffset: number;
  constructor(anchorRowId: string, anchorSpanIndexInRow: number, anchorOffset: number, focusRowId: string, focusSpanIndexInRow: number, focusOffset: number) {
    this.anchorRowId = anchorRowId;
    this.anchorSpanIndexInRow = anchorSpanIndexInRow;
    this.anchorOffset = anchorOffset;
    this.focusRowId = focusRowId;
    this.focusSpanIndexInRow = focusSpanIndexInRow;
    this.focusOffset = focusOffset;
  }

  /**
   * Use this to create a SelectionInfo object from the current selection.
   *
   * If there is not selection, returns null.
   * Makes sure that the entire selection is contained within the terminal, if not, returns null.
   *
   * @param sel The current selection, as returned by window.getSelection().
   * @param terminalId The ID of the terminal. This is used to make sure the selection is contained within the terminal.
   * @returns A SelectionInfo object if the selection is contained within the terminal, otherwise null.
   */
  static createFromSelection(sel: Selection | null, terminalId: string): SelectionInfo | null {
    if (sel === null) {
      return null;
    }

    const anchorNode = sel.anchorNode;
    if (anchorNode === null) {
      return null;
    }
    const anchorOffset = sel.anchorOffset;

    const focusNode = sel.focusNode;
    if (focusNode === null) {
      return null;
    }
    const focusOffset = sel.focusOffset;
    // Get row IDs of the start and end of the selection

    const anchorSpan = anchorNode.parentElement;
    if (anchorSpan === null) {
      return null;
    }
    // Make sure anchor is within the terminal
    let matchingTerminalElement = anchorNode.parentElement!.closest('#' + terminalId);
    if (matchingTerminalElement === null) {
      console.log('Start of selection is not within terminal');
      return null;
    }
    const anchorSpanIndexInRow = getChildNodeIndex(anchorSpan);
    const anchorRowDiv = anchorSpan!.parentElement;
    const anchorRowId = anchorRowDiv!.id;

    const focusSpan = focusNode.parentElement;
    if (focusSpan === null) {
      return null;
    }
    // Make sure focus is within the terminal
    matchingTerminalElement = focusNode.parentElement!.closest('#' + terminalId);
    if (matchingTerminalElement === null) {
      console.log('End of selection is not within terminal');
      return null;
    }
    const focusSpanIndexInRow = getChildNodeIndex(focusSpan);
    const focusRowDiv = focusSpan!.parentElement;
    const focusRowId = focusRowDiv!.id;

    return new SelectionInfo(anchorRowId, anchorSpanIndexInRow, anchorOffset, focusRowId, focusSpanIndexInRow, focusOffset);
  }
}
