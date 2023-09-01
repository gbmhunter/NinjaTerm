import { makeAutoObservable } from 'mobx';

import TextSegment from './TextSegment';

const defaultTxRxColor = 'rgb(255, 255, 255)';

export default class TextSegmentController {
  textSegments: TextSegment[];

  // Keeps track of the total number of characters in all segments, excluding
  // the whitespace at the end
  numCharsInSegments: number;

  // Keeps track of where the cursor is. First number is the index of the
  // segment the cursor is in, the second number is the index of the character
  // in that segments text that the cursor is at
  cursorLocation = [0, 0];

  constructor() {
    this.textSegments = [];
    this.numCharsInSegments = 0;
    // This sets up the text segment array with a default segment
    this.clear();
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }

  appendText(text: string) {
    const lastSegment = this.textSegments[this.textSegments.length - 1];
    if (
      this.cursorLocation[0] === this.textSegments.length - 1 &&
      this.cursorLocation[1] === lastSegment.text.length - 1
    ) {
      // Cursor is at end of entire text, make sure to increase cursor position
      // to keep it at the end (i.e. stay at end)
      this.cursorLocation[1] += text.length;
    }
    // Insert the text almost at the end, but before the whitespace char so
    // that is is always last (for when the cursor needs to appear at the end)
    lastSegment.text = lastSegment.text.insert(
      lastSegment.text.length - 1,
      text
    );
    this.numCharsInSegments += text.length;
  }

  addNewSegment(text: string, colour: string) {
    const lastSegment = this.textSegments[this.textSegments.length - 1];
    if (
      this.cursorLocation[0] === this.textSegments.length - 1 &&
      this.cursorLocation[1] === lastSegment.text.length - 1
    ) {
      // Cursor is at end of entire text, make sure to increase cursor position
      // to keep it at the end (i.e. stay at end)
      this.cursorLocation[0] += 1; // Since the new segment is about to be added we need to bump this by one
      this.cursorLocation[1] = text.length;
    }

    // Remove whitespace char from end of existing last segment
    lastSegment.text = lastSegment.text.slice(0, lastSegment.text.length - 1);
    const newRxTextSegment = new TextSegment(
      text.concat(' '), // Add whitespace to end of new last segment
      colour,
      this.textSegments[this.textSegments.length - 1].key + 1 // Increment key by 1
    );

    this.numCharsInSegments += newRxTextSegment.text.length;
    this.textSegments.push(newRxTextSegment);
  }

  trimSegments(maxCharSize: number) {
    // Trim RX segments if total amount of text exceeds scrollback buffer size
    while (this.numCharsInSegments > maxCharSize) {
      const numCharsToRemove = this.numCharsInSegments - maxCharSize;
      // Remove chars from the oldest text segment first
      const numCharsInOldestSegment = this.textSegments[0].text.length;
      if (numCharsToRemove >= numCharsInOldestSegment) {
        // We can remove the whole text segment, unless it's only one.
        this.textSegments.shift();
        this.numCharsInSegments -= numCharsInOldestSegment;
      } else {
        // The oldest text segment has more chars than what we need to remove,
        // so just trim
        this.textSegments[0].text =
          this.textSegments[0].text.slice(numCharsToRemove);
        this.numCharsInSegments -= numCharsToRemove;
      }
    }
  }

  clear() {
    // Clear any existing segments
    this.textSegments = [];
    // Create a default segment for data to go into. If no ANSI escape codes
    // are received, this will the one and only text segment
    // Also make sure there is always a space at the end, so that the cursor can
    // be added ontop of it if needed
    this.textSegments.push(new TextSegment(' ', defaultTxRxColor, 0));
    this.cursorLocation = [0, 0];
    // Reset char count also
    this.numCharsInSegments = 0;
  }
}
