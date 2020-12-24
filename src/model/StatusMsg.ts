export default class StatusMsg {

  /** Unique ID, starting from 0 and incrementing by 1 for each message. Used so
   * react can render a list of these messages in a performant manner.
   */
  id

  msg = ''

  severity = ''

  constructor(id: number, msg: string, severity: string) {
    this.id = id
    this.msg = msg
    this.severity = severity
  }
}
