/**
 * Bounded text buffer for the MCP `rxstream` resource.
 *
 * One of these exists per MCP session. Received text is appended as it
 * arrives and drained when the client reads the resource. Before this
 * existed the buffer was a bare string that only ever shrank on a read, so a
 * client that subscribed and never read (or dropped its connection without
 * closing the session) leaked the entire serial stream into main-process
 * memory for as long as the app ran.
 *
 * The cap is drop-oldest: once the buffer would exceed `maxChars`, the front
 * is discarded and the number of dropped characters is remembered so the next
 * `drain()` can tell the client the stream has a gap rather than handing it
 * a silently truncated mid-line join.
 */
export class RxStreamBuffer {
  private text = '';

  /** Characters discarded since the last `drain()`. */
  private droppedChars = 0;

  /**
   * @param maxChars Most characters kept. Once exceeded the oldest are dropped.
   *    Trimming is amortised — it runs when the buffer is a quarter over the
   *    cap, not on every chunk — so a saturated stream costs one copy per
   *    `maxChars / 4` characters received rather than one per chunk.
   */
  constructor(private readonly maxChars: number) {
    if (!Number.isInteger(maxChars) || maxChars <= 0) {
      throw new Error(`RxStreamBuffer maxChars must be a positive integer, got ${maxChars}`);
    }
  }

  get length(): number {
    return this.text.length;
  }

  append(chunk: string): void {
    this.text += chunk;
    const trimThreshold = this.maxChars + Math.floor(this.maxChars / 4);
    if (this.text.length > trimThreshold) {
      this._trimToCap();
    }
  }

  /**
   * Returns everything buffered and empties the buffer. If anything was
   * dropped since the previous drain, a single notice line precedes the data
   * so the reader knows there is a gap.
   */
  drain(): string {
    // A read must never hand back more than the cap either, so trim any
    // amortisation slack first.
    if (this.text.length > this.maxChars) {
      this._trimToCap();
    }
    let out = this.text;
    this.text = '';
    if (this.droppedChars > 0) {
      out = `[NinjaTerm: ${this.droppedChars} characters of received data were dropped because the stream buffer overflowed]\n${out}`;
      this.droppedChars = 0;
    }
    return out;
  }

  private _trimToCap(): void {
    const excess = this.text.length - this.maxChars;
    if (excess <= 0) {
      return;
    }
    this.droppedChars += excess;
    this.text = this.text.slice(excess);
  }
}
