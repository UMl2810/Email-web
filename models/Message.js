class Message {
    constructor(sender, receiver, title, message, sendAt, attachment ) {
      this._sender = sender;
      this._receiver = receiver;
      this._title = title;
      this._message = message;
      this._sendAt = sendAt;
      this._attachment = attachment;
    }
    set sender(sender) {
      this._sender = sender;
    }
    set receiver(receiver) {
      this._receiver = receiver;
    }
    set title(title) {
      this._title = title;
     }
    set message(message) {
      this._message = message;
    }
    set sendAt(sendAt) {
      this._sendAt = sendAt;
    }
    get sender() {
      return this._sender;
    }
    get receiver() {
      return this._receiver;
    }
    get title() {
      return this._title;
    }
    get message() {
      return this._message;
    }
    get sendAt() {
      return this._sendAt;
    }
    get attachment() {
      return this._attachment;
    }
    set attachment(attachment) {
      this._attachment = attachment;
    }
}
  module.exports = Message;
  