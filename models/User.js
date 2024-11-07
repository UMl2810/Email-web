class User {
    constructor(fullName, email, password) {
      this.name = fullName;
      this.mail = email;
      this.pass = password;
    }
    set fullName(fullName) {
      this.name = fullName;
    }
    set email(email) {
      this.mail = email;
    }
    set password(password) {
      this.pass = password;
    }
    get fullName() {
      return this.name;
    }
    get email() {
      return this.mail;
    }
    get password() {
      return this.pass;
    }
  }
  
  module.exports = User;