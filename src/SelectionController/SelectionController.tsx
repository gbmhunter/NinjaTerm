export default class SelectionController {
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
   */
  selectTerminalText(startRowId: string, startColIdx: number, endRowId: string, endColIdx: number) {
    console.log('Selecting text from row:', startRowId, 'column:', startColIdx, 'to row:', endRowId, 'column:', endColIdx);
    let selection = window.getSelection();
    let firstRow = document.getElementById(startRowId);

    const { textNode: startTextNode, offset: startOffset } = this.getTextNodeAndOffsetAtColIdx(firstRow!, startColIdx);
    console.log('startTextNode:', startTextNode, 'startOffset:', startOffset);

    let endRow = document.getElementById(endRowId);
    const { textNode: endTextNode, offset: endOffset } = this.getTextNodeAndOffsetAtColIdx(endRow!, endColIdx);
    console.log('endTextNode:', endTextNode, 'endOffset:', endOffset);

    selection!.setBaseAndExtent(startTextNode, startOffset, endTextNode, endOffset);

    // const span = firstRow!.childNodes[0];
    // const textNode = span!.childNodes[0]!;
    // selection!.setBaseAndExtent(textNode, 0, textNode, textNode.textContent!.length);
  }

  private getTextNodeAndOffsetAtColIdx(rowDiv: Element, colIdx: number) {
    // Move through the spans in this row div, finding the span that
    // contains the char at specified colId
    let currSpanIdx = 0;
    let currentSpan = rowDiv.childNodes[currSpanIdx];
    let currTextNode = currentSpan.childNodes[0];
    let currentTextIdxInSpan = 0;
    let currTextInSpan = currentSpan.textContent;
    for (let i = 0; i < colIdx; i++) {
      if (currentTextIdxInSpan >= currTextInSpan!.length) {
        currSpanIdx += 1;
        currentSpan = rowDiv.childNodes[currSpanIdx];
        currTextNode = currentSpan.childNodes[0];
        currentTextIdxInSpan = 0;
        currTextInSpan = currentSpan.textContent;
      }
      currentTextIdxInSpan += 1;
    }

    return { textNode: currTextNode, offset: currentTextIdxInSpan };
  }
}
