/**
 * users.js
 * These are example routes for user management
 * This shows how to correctly structure your routes for the project
 * and the suggested pattern for retrieving data by executing queries
 *
 * NB. it's better NOT to use arrow functions for callbacks with the SQLite library
 *
 */

const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

/**
 * @desc Display all the users
 */
router.get("/list-users", (req, res, next) => {
  // Define the query
  query = "SELECT * FROM users";

  // Execute the query and render the page with the results
  global.db.all(query, function (err, rows) {
    if (err) {
      next(err); //send the error on to the error handler
    } else {
      res.json(rows); // render page as simple json
    }
  });
});

/**
 * @desc Displays a page with a form for creating a user record
 */
router.get("/add-user", (req, res) => {
  res.render("add-user.ejs");
});

/**
 * @desc Add a new user to the database based on data from the submitted form
 */
router.post("/add-user", async (req, res, next) => {
  // Define the query
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  query = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
  query_parameters = [name, email, hashedPassword];

  // Execute the query and send a confirmation message
  global.db.run(query, query_parameters, function (err) {
    if (err) {
      next(err); //send the error on to the error handler
    } else {
      // Assuming newUser contains user details like id, username, etc.
      console.log("New user created", this.lastID);
      req.session.userId = this.lastID; // Save the user id to the session

      res.redirect("/"); // Redirect to user profile or dashboard
      next();
    }
  });
});

router.get("/login", (req, res) => {
  res.render("login.ejs", {
    errors: {},
  });
});

async function getUserByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;

  const user = await getUserByEmail(email);

  console.log("password", password, email, user);

  if (user && (await bcrypt.compare(password, user.password))) {
    console.log("User logged in", user.id);
    req.session.userId = user.id;
    console.log("User logged in", req.session.userId);
    res.redirect("/");
  } else {
    res.render("login.ejs", {
      errors: {
        general: "Invalid email or password",
      },
    });
  }
});

// Export the router object so index.js can access it
module.exports = router;
