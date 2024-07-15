/**
 * index.js
 * Main entry point for the application.
 */

const session = require("express-session");
require("dotenv").config(); // Load environment variables from .env file

// Set up express, bodyparser and EJS
const express = require("express");
const app = express();
const port = 3000;

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("view engine", "ejs"); // Set the app to use EJS for rendering
app.use(express.static(__dirname + "/public")); // Set location of static files
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
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// Middleware to fetch user data for all requests
app.use((req, res, next) => {
  if (req.session.userId) {
    // Fetch user data if user is logged in
    db.get(
      "SELECT * FROM users WHERE id = ?",
      [req.session.userId],
      (err, user) => {
        if (err || !user) {
          res.locals.user = null; // No user found or error occurred
        } else {
          res.locals.user = user; // Set user data to locals
        }
        next(); // Proceed to next middleware or route handler
      }
    );
  } else {
    res.locals.user = null; // No user logged in
    next(); // Proceed to next middleware or route handler
  }
});

// Set up SQLite database connection
const sqlite3 = require("sqlite3").verbose();
global.db = new sqlite3.Database("./database.db", function (err) {
  if (err) {
    console.error(err);
    process.exit(1); // Exit application if database connection fails
  } else {
    console.log("Database connected");
    global.db.run("PRAGMA foreign_keys=ON"); // Enable foreign key constraints
  }
});

// @route GET /
// Handle requests to the home page
app.get("/", (req, res) => {
  res.render("index"); // Render the index page
});

// Include all route handlers from usersRoutes under the path /users
const usersRoutes = require("./routes/users");
app.use("/users", usersRoutes);

// Include all route handlers from articles under the path /articles
const articles = require("./routes/articles");
app.use("/articles", articles);

// Middleware to check if user is an admin
const isAdmin = (req, res, next) => {
  if (res.locals.user?.role === "ADMIN") {
    next(); // User is admin, proceed to the next middleware or route handler
  } else {
    res.render("error", {
      url: req.url,
      errorMessage: "Unauthorized",
    }); // Render an error page if user is not an admin
  }
};

// @route GET /admin
// Admin panel route to manage users
app.get("/admin", isAdmin, async (req, res) => {
  const search = req.query.search || "";

  const query = `
    SELECT
      id, name, email, created_on, blog_title, role
    FROM users
    WHERE name LIKE ? OR email LIKE ? OR blog_title LIKE ? OR role LIKE ?
    ORDER BY created_on DESC
  `;

  const queryParams = [
    `%${search}%`,
    `%${search}%`,
    `%${search}%`,
    `%${search}%`,
  ];

  try {
    const users = await new Promise((resolve, reject) => {
      global.db.all(query, queryParams, (err, rows) => {
        if (err) {
          reject(err); // Reject promise on error
        } else {
          resolve(rows); // Resolve with fetched users
        }
      });
    });

    res.render("admin", {
      users: users,
      search: search,
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  const userId = req.session?.userId;
  if (userId) {
    return next(); // User is authenticated, proceed to the next middleware or route handler
  } else {
    res.redirect("/users/signin"); // Redirect to signin page if not authenticated
  }
}

// Include all route handlers from authorRoutes under the path /author, with authentication middleware
const authorRoutes = require("./routes/author");
app.use("/author", isAuthenticated, authorRoutes);

/**
 * Handle 404 and 500 errors
 */
app.use(function (req, res, next) {
  res.status(404);
  res.render("error", { url: req.url, errorMessage: "Not found" });
});

app.use(function (err, req, res, next) {
  res.status(500);
  res.render("error", { url: req.url, errorMessage: "Internal Server Error" });
});

// Start the web application listening for HTTP requests
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
