const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const multer = require("multer");
const mysql = require("mysql2");

const app = express();
app.use(cookieParser());
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const UserRepo = require("./utils/UserRepo");
const MessageRepo = require("./utils/MessageRepo");
const Message = require("./models/Message");

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'wpr',
    password: 'fit2024',
    port: 3306,
    database: 'wpr2101040047'
});

const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
      filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
    })
  });

const authenticationMiddleware = (req, res, next) => {
    if (!req.cookies.email) {
        const restrictedRoutes = ['/outbox', '/compose-message', '/inbox'];
        if (restrictedRoutes.includes(req.originalUrl)) {
            return res.render("signin.ejs", { error: "Access denied. Please sign in to continue." });
        }
        return res.render("signin.ejs");
    }
    next();
};
app.get("/", authenticationMiddleware, (req, res) => {
    res.redirect(req.cookies.email ? '/inbox' : 'signin.ejs');
});

app.get("/inbox", authenticationMiddleware, (req, res) => {
    const userEmail = req.cookies.email;
    const messageRepo = new MessageRepo(connection);
    messageRepo.getEmailList(userEmail, req.query.pageNumber, req.query.pageSize)
        .then(messages => {
            const userRepo = new UserRepo(connection);
            userRepo.getUserByEmail(userEmail)
                .then(user => res.render("inbox.ejs", { list: res, email: userEmail, data: messages, fullname: user.fullName }));
        });
});

app.get("/signup", (req, res) => res.render('signup', { err: null }));

app.get("/messages", authenticationMiddleware, (req, res) => res.send(res));

app.get("/logout", (req, res) => {
    res.clearCookie("email");
    res.redirect("/");
});

app.post("/signin", upload.none(), (req, res) => {
    const { email, password } = req.body;
    const userRepo = new UserRepo(connection);
    userRepo.getUserByEmailAndPassword(email, password)
        .then(result => {
            if (result.length) {
                res.cookie("email", email, { maxAge: 1000000 });
                res.redirect("/inbox");
            } else {
                res.render("signin.ejs", { error: "Invalid email or password", input: { email, password } });
            }
        })
        .catch(() => res.redirect("/"));
});

app.get("/compose-message", authenticationMiddleware, (req, res) => {
    const userRepo = new UserRepo(connection);
    userRepo.getAllUsers().then(users => {
        const emailList = users.map(user => user.email).filter(email => email !== req.cookies.email);
        res.render("compose.ejs", { emails: emailList });
    });
});

app.get("/message/:id", authenticationMiddleware, (req, res) => {
    const messageRepo = new MessageRepo(connection);
    messageRepo.getEmailById(req.params.id)
        .then(message => {
            const backUrl = req.headers.referer.includes('/outbox') ? '/outbox' : '/inbox';
            res.render("messageDetail.ejs", { data: message, returnLink: backUrl });
        })
        .catch(() => res.render("messageDetail.ejs"));
});

app.post("/compose-message", authenticationMiddleware, upload.single('attachment'), (req, res) => {
    const messageRepo = new MessageRepo(connection);
    const userRepo = new UserRepo(connection);
    const senderEmail = req.cookies.email;
    const attachment = req.file ? req.file.filename : null;
    
    userRepo.getAllUsers().then(users => {
        const emailList = users.map(user => user.email).filter(email => email !== req.cookies.email);
        
        if (!req.body.receiver) {
            return res.render("compose.ejs", { 
                error: "Receiver is required", 
                input: req.body, 
                emails: emailList 
            });
        }
        
        userRepo.getUserByEmail(req.body.receiver).then(receiver => {
            if (!receiver) {
                return res.render("compose.ejs", { 
                    error: "Receiver does not exist", 
                    input: req.body, 
                    emails: emailList 
                });
            }
            
            const newMessage = new Message(
                senderEmail,
                req.body.receiver,
                req.body.title,
                req.body.message,
                new Date(),
                attachment
            );
            
            messageRepo.createMessage(newMessage)
                .then(() => {
                    res.render("compose.ejs", { 
                        success: "Message sent successfully!" + (attachment ? " File uploaded: " + attachment : ""),
                        emails: emailList
                    });
                })
                .catch((error) => {
                    console.error("Error creating message:", error);
                    res.render("compose.ejs", { 
                        error: "Something went wrong", 
                        input: req.body,
                        emails: emailList 
                    });
                });
        });
    });
});

app.get("/api/messages", authenticationMiddleware, (req, res) => {
    const userEmail = req.cookies.email;
    const messageRepo = new MessageRepo(connection);
    messageRepo.getEmailList(userEmail, req.query.pageNumber, req.query.pageSize)
        .then(result => res.json(result));
});

app.get("/outbox", authenticationMiddleware, (req, res) => {
    const userEmail = req.cookies.email;
    const messageRepo = new MessageRepo(connection);
    messageRepo.getEmailBySender(userEmail, req.query.pageNumber, req.query.pageSize)
        .then(messages => {
            const userRepo = new UserRepo(connection);
            userRepo.getUserByEmail(userEmail)
                .then(user => res.render("outbox.ejs", { list: res, email: userEmail, data: messages, fullname: user.fullName }));
        });
});

app.get("/api/outbox", authenticationMiddleware, (req, res) => {
    const userEmail = req.cookies.email;
    const messageRepo = new MessageRepo(connection);
    messageRepo.getEmailBySender(userEmail, req.query.pageNumber, req.query.pageSize)
        .then(result => res.json(result));
});

app.post("/signup", (req, res) => {
    const { fullname, email, password, confirmPassword } = req.body;
    if (!fullname || !email || !password || !confirmPassword) {
        return res.render('signup', { error: 'Please fill in all fields' });
    }
    if (password.length < 6) {
        return res.render('signup', { error: 'Password must be at least 6 characters long' });
    }
    if (password !== confirmPassword) {
        return res.render('signup', { error: 'Passwords do not match' });
    }
    connection.query('SELECT * FROM users WHERE email = ?', [email], (error, results) => {
        if (error) {
            console.error('Database error:', error);
            return res.status(500).render('error', { status: 500, message: 'Internal Server Error' });
        }
        if (results.length) {
            return res.render('signup', { error: 'Email address is already in use' });
        }
        connection.query('INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)', [fullname, email, password], (error, result) => {
            if (error) {
                console.error('Error saving new user:', error);
                return res.status(500).render('error', { status: 500, message: 'Internal Server Error' });
            }
            const newUser = { id: result.insertId, fullname, email, password };
            res.cookie('userId', newUser.id.toString());
            res.render('welcome', { user: newUser});
        });
    });
});

app.delete("/api/delete", authenticationMiddleware, (req, res) => {
    const email = req.cookies.email;
    const messageRepo = new MessageRepo(connection);
    const deleteAction = req.query.action === "receiver" ? messageRepo.deleteListOfEmailByReceiverEmail : messageRepo.deleteListOfEmailBySenderEmail;
    deleteAction.call(messageRepo, email, req.query.ids).then(result => res.json(result)).catch(() => res.status(400).send("Bad request"));
});

app.listen(8000, () => console.log("Server running on http://localhost:8000"));