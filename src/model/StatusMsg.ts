export enum StatusMsgSeverity {
  INFO, // White
  OK, // Green
  WARNING, // Orange
  ERROR, // Red
}

export class StatusMsg {
  /** Unique ID, starting from 0 and incrementing by 1 for each message. Used so
   * react can render a list of these messages in a performant manner.
   */
  id = 0;

  msg = '';

  severity: StatusMsgSeverity = StatusMsgSeverity.OK;

  showInPortSettings = false;

  constructor(
    id: number,
    msg: string,
    severity: StatusMsgSeverity,
    showInPortSettings: boolean = false
  ) {
    this.id = id;
    this.msg = msg;
    this.severity = severity;
    this.showInPortSettings = showInPortSettings;
  }
}
