export default class StatusMsg {
  msg = ''

  severity = ''

  constructor(msg: string, severity: string) {
    this.msg = msg
    this.severity = severity
  }
}
