class MessageRepositories {
  constructor(connection) {
    this._connection = connection;
  }

  createMessage(message) {
    return new Promise((resolve, reject) => {
      const sql = "INSERT INTO messages (sender, receiver, title, message, sendAt, attachment) VALUES (?, ?, ?, ?, ?, ?)";
      const params = [message.sender, message.receiver, message.title, message.message, message.sendAt, message.attachment];
      this._connection.query(sql, params, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }

  getEmailById(id) {
    return new Promise((resolve, reject) => {
      const sql = "SELECT *, users.fullName AS senderName, users.fullName AS receiverName FROM messages LEFT JOIN users ON messages.sender = users.email LEFT JOIN users AS receiver ON messages.receiver = receiver.email WHERE messages.id = ?";
      this._connection.query(sql, [id], (err, result) => {
        if (err) return reject(err);
        resolve(result[0]);
      });
    });
  }

  getEmailBySender(sender, page, limit) {
    return new Promise((resolve, reject) => {
      const numPerPage = parseInt(limit, 10) || 5;
      const pageNumber = parseInt(page, 10) || 1;
      this._connection.query(
        "SELECT COUNT(*) AS numRows FROM messages WHERE sender = ? AND senderDeleted = 0",
        [sender],
        (err, results) => {
          if (err) return reject(err);
          const numRows = results[0].numRows;
          const numPages = Math.ceil(numRows / numPerPage);
          this._connection.query(
            "SELECT messages.id, messages.sender, messages.receiver, messages.title, messages.message, messages.sendAt, messages.receiverDeleted, messages.senderDeleted, users.fullName AS receiverName " +
            "FROM messages INNER JOIN users ON messages.receiver = users.email " +
            "WHERE sender = ? AND senderDeleted = 0 ORDER BY sendAt DESC LIMIT ? OFFSET ?",
            [sender, numPerPage, (pageNumber - 1) * numPerPage],
            (err, result) => {
              if (err) return reject(err);
              resolve({ items: result, pageNumber, pageSize: numPerPage, totalPage: numPages, total: numRows });
            }
          );
        }
      );
    });
  }

  getEmailList(receiver, page, limit) {
    return new Promise((resolve, reject) => {
      const numPerPage = parseInt(limit, 10) || 5;
      const pageNumber = parseInt(page, 10) || 1;
      this._connection.query(
        "SELECT COUNT(*) AS numRows FROM messages WHERE receiver = ? AND receiverDeleted = 0",
        [receiver],
        (error, results) => {
          if (error) return reject(error);
          const numRows = results[0].numRows;
          const numPages = Math.ceil(numRows / numPerPage);
          this._connection.query(
            "SELECT messages.id, messages.sender, messages.receiver, messages.title, messages.message, messages.sendAt, messages.receiverDeleted, messages.senderDeleted, users.fullName AS senderName " +
            "FROM messages INNER JOIN users ON messages.sender = users.email " +
            "WHERE receiver = ? AND receiverDeleted = 0 ORDER BY sendAt DESC LIMIT ? OFFSET ?",
            [receiver, numPerPage, (pageNumber - 1) * numPerPage],
            (error, result) => {
              if (error) return reject(error);
              resolve({ items: result, pageNumber, pageSize: numPerPage, totalPage: numPages, total: numRows });
            }
          );
        }
      );
    });
  }

  deleteListOfEmailByReceiverEmail(receiverEmail, emailList) {
    return new Promise((resolve, reject) => {
      this._connection.query(
        "UPDATE messages SET receiverDeleted = 1 WHERE receiver = ? AND id IN (?)",
        [receiverEmail, emailList],
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    });
  }

  deleteListOfEmailBySenderEmail(senderEmail, emailList) {
    return new Promise((resolve, reject) => {
      this._connection.query(
        "UPDATE messages SET senderDeleted = 1 WHERE sender = ? AND id IN (?)",
        [senderEmail, emailList],
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    });
  }
}

module.exports = MessageRepositories;
