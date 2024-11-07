class UserRepositories {
    constructor(connection) {
      this._connection = connection;
    }
  
    createUser(user) {
      return new Promise((resolve, reject) => {
        this._connection.query(
          "INSERT INTO users (fullName, email, password) VALUES (?, ?, ?)",
          [user.fullName, user.email, user.password],
          (err, result) => {
            if (err) reject(err);
            resolve(result);
          }
        );
      });
    }
  
    getAllUsers() {
      return new Promise((resolve, reject) => {
        this._connection.query("SELECT * FROM users", (error, result) => {
          if (error) reject(error);
          resolve(result);
        });
      });
    }
  
    getUserByEmail(email) {
      return new Promise((resolve, reject) => {
        this._connection.query(
          "SELECT * FROM users WHERE email = ?",
          [email],
          (error, result) => {
            if (error) reject(error);
            resolve(result[0]);
          }
        );
      });
    }

    getUserByEmailAndPassword(email, password) {
      return new Promise((resolve, reject) => {
        this._connection.query(
          "SELECT * FROM users WHERE email = ? AND password = ?",
          [email, password],
          (error, result) => {
            if (error) reject(error);
            resolve(result);
          }
        );
      });
    }
  }
  module.exports = UserRepositories;
  