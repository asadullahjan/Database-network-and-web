/**
 * index.js
 * This is your main app entry point
 */

const session = require("express-session");
require("dotenv").config(); // Load environment variables from .env file

// Set up express, bodyparser and EJS
const express = require("express");
const app = express();
const port = 3000;
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs"); // set the app to use ejs for rendering
app.use(express.static(__dirname + "/public")); // set location of static files
app.set("view cache", false);

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  console.error("SESSION_SECRET environment variable is not set!");
  process.exit(1);
}

// Set up sessions
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // set to true if using HTTPS
  })
);

// Middleware to fetch user data for all requests
app.use((req, res, next) => {
  if (req.session.userId) {
    db.get(
      "SELECT * FROM users WHERE id = ?",
      [req.session.userId],
      (err, user) => {
        if (err || !user) {
          res.locals.user = null;
        } else {
          res.locals.user = user;
        }
        next();
      }
    );
  } else {
    res.locals.user = null;
    next();
  }
});

// Set up SQLite
// Items in the global namespace are accessible throught out the node application
const sqlite3 = require("sqlite3").verbose();
global.db = new sqlite3.Database("./database.db", function (err) {
  if (err) {
    console.error(err);
    process.exit(1); // bail out we can't connect to the DB
  } else {
    console.log("Database connected");
    global.db.run("PRAGMA foreign_keys=ON"); // tell SQLite to pay attention to foreign key constraints
  }
});

// Handle requests to the home page
app.get("/", (req, res) => {
  res.render("index");
});

// Add all the route handlers in usersRoutes to the app under the path /users
const usersRoutes = require("./routes/users");
app.use("/users", usersRoutes);

function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return next(); // User is authenticated, proceed to the next middleware/route handler
  } else {
    res.redirect("/users/login"); // User is not authenticated, redirect to the login page
  }
}

// Add all the route handlers in authorRoutes to the app under the path /author
const authorRoutes = require("./routes/author");
app.use("/author", isAuthenticated, authorRoutes);

// Make the web application listen for HTTP requests
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
