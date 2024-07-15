const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

/**
 * @desc Displays a page with a form for creating a user record
 * @route GET /signup
 */
router.get("/signup", (req, res) => {
  res.render("signup.ejs");
});

/**
 * @desc Add a new user to the database based on data from the submitted form
 * @route POST /signup
 */
router.post("/signup", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
    const query_parameters = [name, email, hashedPassword];

    global.db.run(query, query_parameters, function (err) {
      if (err) {
        return next(err); //send the error on to the error handler
      } else {
        console.log("New user created", this.lastID);
        req.session.userId = this.lastID; // Save the user id to the session

        res.redirect("/"); // Redirect to user profile or dashboard
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @desc Displays the signin page
 * @route GET /signin
 */
router.get("/signin", (req, res) => {
  res.render("signin.ejs", {
    errors: {},
  });
});

/**
 * @desc Retrieves a user by email from the database
 * @param {String} email - User's email
 * @returns {Promise<Object>} User object if found, null otherwise
 */
async function getUserByEmail(email) {
  return new Promise((resolve, reject) => {
    global.db.get(
      "SELECT * FROM users WHERE email = ?",
      [email],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      }
    );
  });
}

/**
 * @desc Handles user signin
 * @route POST /signin
 */
router.post("/signin", async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await getUserByEmail(email);

    if (user && (await bcrypt.compare(password, user.password))) {
      req.session.userId = user.id;
      res.redirect("/");
    } else {
      res.render("signin.ejs", {
        errors: {
          general: "Invalid email or password",
        },
      });
    }
  } catch (err) {
    next(err);
  }
});

/**
 * @desc Handles user logout
 * @route GET /logout
 */
router.get("/logout", (req, res) => {
  req.session.userId = null;
  res.redirect("/");
});

/**
 * @desc Updates a user's role
 * @route POST /:userId/update-role
 */
router.post("/:userId/update-role", async (req, res, next) => {
  const userId = req.params.userId;
  const role = req.body.role;
  const user = res.locals.user;

  if (user.role !== "ADMIN") {
    res.status(403).send("You do not have permission to update user roles");
    return;
  }

  const query = "UPDATE users SET role = ? WHERE id = ?";
  const queryParameters = [role, userId];

  try {
    global.db.run(query, queryParameters, function (err) {
      if (err) {
        res.status(500).send("Error updating user role");
      } else {
        res.status(200).send("User role updated");
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @desc Deletes a user
 * @route DELETE /:userId/delete
 */
router.delete("/:userId/delete", async (req, res, next) => {
  const userId = req.params.userId;
  const user = res.locals.user;

  if (user.role !== "ADMIN") {
    res.status(403).send("You do not have permission to update user roles");
    return;
  }
  
  const query = "DELETE FROM users WHERE id = ?";
  const queryParameters = [userId];

  try {
    global.db.run(query, queryParameters, function (err) {
      if (err) {
        res.status(500).send("Error deleting user");
      } else {
        res.status(200).send("User deleted");
      }
    });
  } catch (err) {
    next(err);
  }
});

// Export the router object so index.js can access it
module.exports = router;
