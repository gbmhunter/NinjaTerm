import React from 'react';

/**
 * Represents a single character in the terminal
 */
export default class TerminalChar {
  char: string;

  // Reserved for inline style overrides; empty object by default.
  style: React.CSSProperties;

  className = '';

  /**
   * True if this character was not actually received over the serial port, but has been added
   * by this code specifically for showing the cursor. These special cursor chars will be deleted
   * when the cursor moves location.
   */
  forCursor: boolean;

  constructor() {
    this.char = '';
    this.style = {};
    this.forCursor = false;
  }
}
