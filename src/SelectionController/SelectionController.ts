import { getChildNodeIndex } from '../Util/Util';

/**
 * Represents a selection (click and dragged selected text) in a terminal pane.
 */
export class SelectionInfo {
  anchorRowId: string;
  anchorSpanIndexInRow: number;
  anchorOffset: number;
  anchorColIdx: number;

  focusRowId: string;
  focusSpanIndexInRow: number;
  focusOffset: number;
  focusColIdx: number;

  firstRowId: string;
  firstSpanIndexInRow: number;
  firstOffset: number;
  firstColIdx: number;

  lastRowId: string;
  lastSpanIndexInRow: number;
  lastOffset: number;
  lastColIdx: number;

  constructor(
      anchorRowId: string,
      anchorSpanIndexInRow: number,
      anchorOffset: number,
      anchorColIdx: number,
      focusRowId: string,
      focusSpanIndexInRow: number,
      focusOffset: number,
      focusColIdx: number,
      firstRowId: string,
      firstSpanIndexInRow: number,
      firstOffset: number,
      firstColIdx: number,
      lastRowId: string,
      lastSpanIndexInRow: number,
      lastOffset: number,
      lastColIdx: number) {
    this.anchorRowId = anchorRowId;
    this.anchorSpanIndexInRow = anchorSpanIndexInRow;
    this.anchorOffset = anchorOffset;
    this.anchorColIdx = anchorColIdx;

    this.focusRowId = focusRowId;
    this.focusSpanIndexInRow = focusSpanIndexInRow;
    this.focusOffset = focusOffset;
    this.focusColIdx = focusColIdx;

    this.firstRowId = firstRowId;
    this.firstSpanIndexInRow = firstSpanIndexInRow;
    this.firstOffset = firstOffset;
    this.firstColIdx = firstColIdx;

    this.lastRowId = lastRowId;
    this.lastSpanIndexInRow = lastSpanIndexInRow;
    this.lastOffset = lastOffset;
    this.lastColIdx = lastColIdx;
  }


}

export class SelectionController {
  constructor() {
  }

  /**
   * Use this to select specific text in a terminal, providing a start and end row ID and column index.
   *
   * Used by the e2e tests in SelectingText.spec.ts.
   *
   * @param startRowId The ID of the text row in the terminal that you want to start the selection at.
   * @param startColIdx The text column index in the start row that you want to start the selection at.
   * @param endRowId The ID of the text row in the terminal that you want to end the selection at.
   * @param endColIdx The text column index in the end row that you want to end the selection at.
   * @returns Returns true if selection was able to be made (i.e. start and end rows were found, column indexes in these rows
   *    were valid), otherwise false.
   */
  static selectTerminalText(startRowId: string, startColIdx: number, endRowId: string, endColIdx: number) {
    console.log('Selecting text from row:', startRowId, 'column:', startColIdx, 'to row:', endRowId, 'column:', endColIdx);
    let selection = window.getSelection();
    if (selection === null) {
      return false;
    }

    const startRowElement = document.getElementById(startRowId);
    if (startRowElement === null) {
      return false;
    }

    const { textNode: startTextNode, offset: startOffset } = this.getTextNodeAndOffsetAtColIdx(startRowElement, startColIdx);
    // console.log('startTextNode:', startTextNode, 'startOffset:', startOffset);
    if (startTextNode === null) {
      return false;
    }

    const endRowElement = document.getElementById(endRowId);
    if (endRowElement === null) {
      return false;
    }
    const { textNode: endTextNode, offset: endOffset } = this.getTextNodeAndOffsetAtColIdx(endRowElement, endColIdx);
    // console.log('endTextNode:', endTextNode, 'endOffset:', endOffset);
    if (endTextNode === null) {
      return false;
    }

    selection.setBaseAndExtent(startTextNode, startOffset, endTextNode, endOffset);

    return true;
  }

  private static getTextNodeAndOffsetAtColIdx(rowDiv: Element, colIdx: number) {
    // Move through the spans in this row div, finding the span that
    // contains the char at specified colId
    let currSpanIdx = 0;
    if (currSpanIdx >= rowDiv.childNodes.length) {
      return { textNode: null, offset: 0 };
    }
    let currentSpan = rowDiv.childNodes[currSpanIdx];

    if (currentSpan.childNodes.length === 0) {
      return { textNode: null, offset: 0 };
    }
    let currTextNode = currentSpan.childNodes[0];
    let currentTextIdxInSpan = 0;
    let currTextInSpan = currentSpan.textContent;
    if (currTextInSpan === null || currTextInSpan.length === 0) {
      return { textNode: null, offset: 0 };
    }
    for (let i = 0; i < colIdx; i++) {
      if (currentTextIdxInSpan >= currTextInSpan!.length) {
        currSpanIdx += 1;
        if (currSpanIdx >= rowDiv.childNodes.length) {
          // Ran out of spans, bail
          return { textNode: null, offset: 0 };
        }
        currentSpan = rowDiv.childNodes[currSpanIdx];
        if (currentSpan.childNodes.length === 0) {
          // No text node in span, bail
          return { textNode: null, offset: 0 };
        }
        currTextNode = currentSpan.childNodes[0];
        currentTextIdxInSpan = 0;
        currTextInSpan = currentSpan.textContent;
        if (currTextInSpan === null || currTextInSpan.length === 0) {
          // No text in span, bail
          return { textNode: null, offset: 0 };
        }
      }
      currentTextIdxInSpan += 1;
    }

    return { textNode: currTextNode, offset: currentTextIdxInSpan };
  }

  /**
   * Use this to create a SelectionInfo object from the current selection.
   *
   * If there is not selection, returns null.
   * Makes sure that the entire selection is contained within the terminal, if not, returns null.
   *
   * @param sel The current selection, as returned by window.getSelection().
   * @param terminalId The ID of the terminal, e.g. "tx-rx-terminal". This is used to make sure the selection is contained within the terminal.
   * @returns A SelectionInfo object if the selection is contained within the terminal, otherwise null.
   */
  static getSelectionInfo(sel: Selection | null, terminalId: string): SelectionInfo | null {
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

    // Calculate column indexes
    //=============================

    let anchorColIdx = 0;
    for (let i = 0; i <= anchorSpanIndexInRow - 1; i++) {
      const span = anchorRowDiv!.children[i];
      anchorColIdx += span.textContent!.length;
    }
    anchorColIdx += anchorOffset;

    let focusColIdx = 0;
    for (let i = 0; i <= focusSpanIndexInRow - 1; i++) {
      const span = focusRowDiv!.children[i];
      focusColIdx += span.textContent!.length;
    }
    focusColIdx += focusOffset;

    console.log('anchorColIdx: ', anchorColIdx, ' focusColIdx: ', focusColIdx);

    //=============================

    // Also convert from focus/anchor to first/last
    // Anchor is were the user began the selection, focus is where they ended it
    // Assume it's true, check all conditions that would make it false
    let isSelectionForwards = true
    if (anchorRowId > focusRowId) {
      isSelectionForwards = false;
    } else if (anchorRowId === focusRowId) {
      // Need to look at spans
      if (anchorSpanIndexInRow > focusSpanIndexInRow) {
        isSelectionForwards = false;
      } else if (anchorSpanIndexInRow === focusSpanIndexInRow) {
        // Same span, need to look at offsets
        if (anchorOffset > focusOffset) {
          isSelectionForwards = false;
        }
      }
    }
    console.log('isSelectionForwards: ', isSelectionForwards);

    let firstRowId = '';
    let firstRowSpanIndex = 0;
    let firstRowOffset = 0;
    let firstRowColIdx = 0;
    let lastRowId = '';
    let lastRowSpanIndex = 0;
    let lastRowOffset = 0;
    let lastRowColIdx = 0;
    if (isSelectionForwards) {
      firstRowId = anchorRowId;
      firstRowSpanIndex = anchorSpanIndexInRow;
      firstRowOffset = anchorOffset;
      firstRowColIdx = anchorColIdx;
      lastRowId = focusRowId;
      lastRowSpanIndex = focusSpanIndexInRow;
      lastRowOffset = focusOffset;
      lastRowColIdx = focusColIdx;
    } else {
      // Invert everything
      firstRowId = focusRowId;
      firstRowSpanIndex = focusSpanIndexInRow;
      firstRowOffset = focusOffset;
      firstRowColIdx = focusColIdx;
      lastRowId = anchorRowId;
      lastRowSpanIndex = anchorSpanIndexInRow;
      lastRowOffset = anchorOffset;
      lastRowColIdx = anchorColIdx;
    }


    return new SelectionInfo(
      anchorRowId,
      anchorSpanIndexInRow,
      anchorOffset,
      anchorColIdx,
      focusRowId,
      focusSpanIndexInRow,
      focusOffset,
      focusColIdx,
      firstRowId,
      firstRowSpanIndex,
      firstRowOffset,
      firstRowColIdx,
      lastRowId,
      lastRowSpanIndex,
      lastRowOffset,
      lastRowColIdx);
  }
}
