const mysql = require('mysql2');
const User = require("./models/User.js");
const UserRepository = require("./utils/UserRepo.js");
const Message = require("./models/Message.js");
const MessageRepository = require("./utils/MessageRepo.js");

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'wpr',
    password: 'fit2024',
    port: 3306,
});

connection.query("CREATE DATABASE IF NOT EXISTS wpr2101040047", (err) => {
  if (err) throw err;

  connection.query("USE wpr2101040047", (err) => {
    if (err) throw err;

    connection.query(
      "CREATE TABLE IF NOT EXISTS users (fullName VARCHAR(255), email VARCHAR(255) PRIMARY KEY, password VARCHAR(255))",
      (err) => {
        if (err) throw err;

        connection.query(
          `CREATE TABLE IF NOT EXISTS messages (
            id INT AUTO_INCREMENT PRIMARY KEY, 
            sender VARCHAR(255), 
            receiver VARCHAR(255), 
            title TEXT, 
            message TEXT, 
            sendAt DATETIME, 
            receiverDeleted BOOLEAN NOT NULL DEFAULT 0, 
            senderDeleted BOOLEAN NOT NULL DEFAULT 0, 
            attachment VARCHAR(255),
            FOREIGN KEY (sender) REFERENCES users(email),
            FOREIGN KEY (receiver) REFERENCES users(email)
          )`,
          (err) => {
            if (err) throw err;

            const user1 = new User("Cuong", "a@a.com", "123");
            const user2 = new User("Thai", "Thai@gmail.com", "123");
            const user3 = new User("Huy", "Huy@gmail.com", "123");
            const userRepository = new UserRepository(connection);

            Promise.all([
              userRepository.createUser(user1),
              userRepository.createUser(user2),
              userRepository.createUser(user3),
            ])
              .then(() => {
                const messageRepository = new MessageRepository(connection);
                const messageData = [
                  new Message(user1.email, user2.email, "Hello", "Hello", new Date()),
                  new Message(user2.email, user1.email, "Hello", "Hello", new Date()),
                  new Message(user1.email, user3.email, "Hello", "Hello", new Date()),
                  new Message(user3.email, user1.email, "Hello", null, new Date()),
                  new Message(user2.email, user3.email, "Hello", "Hello", new Date()),
                  new Message(user3.email, user2.email, "Hello", null, new Date()),
                  new Message(user1.email, user2.email, null, "Hello", new Date()),
                  new Message(user3.email, user1.email, null, "Hello", new Date()),
                ];

                Promise.all(messageData.map(data => messageRepository.createMessage(data)))
                  .then(() => {
                    console.log("Database initialized successfully");
                    process.exit();
                  })
                  .catch((err) => {
                    console.log(err);
                    process.exit();
                  });
              })
              .catch((err) => {
                console.log(err);
                process.exit();
              });
          }
        );
      }
    );
  });
});
