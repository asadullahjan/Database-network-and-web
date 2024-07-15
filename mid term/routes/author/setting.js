const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

/**
 * @desc Retrieve user settings for rendering the settings page
 * @route GET /author/settings
 * @param {String} req.session.userId - User ID from session
 * @returns {HTML} Rendered settings page with user settings
 */
router.get("/", async (req, res, next) => {
  try {
    const user = await new Promise((resolve, reject) => {
      global.db.get(
        "SELECT * FROM users WHERE id = ?",
        [req.session.userId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });

    console.log("user", user, req.session.userId, "req.session.userId");

    res.render("author/settings.ejs", {
      formValues: {
        new_name: user.name,
        new_email: user.email,
        new_blog_title: user.blog_title,
        old_password: "",
        new_password: "",
      },
      errors: {},
      success: {},
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @desc Update user settings based on form input
 * @route POST /author/settings
 * @param {String} req.session.userId - User ID from session
 * @param {String} req.body.new_name - New name for the user (optional)
 * @param {String} req.body.new_email - New email for the user (optional)
 * @param {String} req.body.new_blog_title - New blog title for the user (optional)
 * @param {String} req.body.old_password - Old password for verification (if new password provided)
 * @param {String} req.body.new_password - New password for the user (optional)
 * @returns {HTML} Rendered settings page with success message upon successful update
 * @throws {Error} Passes errors to the global error handling middleware
 */
router.post("/", async (req, res, next) => {
  try {
    const { new_name, new_blog_title, new_email, old_password, new_password } =
      req.body;

    const errors = {};

    if (!req.session.userId) {
      errors.general = "Please signin to update your settings";
    } else {
      const user = await new Promise((resolve, reject) => {
        global.db.get(
          "SELECT password FROM users WHERE id = ?",
          [req.session.userId],
          (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(row);
            }
          }
        );
      });

      if (
        new_password &&
        !(await bcrypt.compare(old_password, user.password))
      ) {
        errors.old_password = "Old password is incorrect";
      }
    }

    if (Object.keys(errors).length > 0) {
      res.render("author/settings.ejs", {
        formValues: { ...req.body },
        errors,
        success: {},
      });
    } else {
      let query = `
        UPDATE users SET 
          name = COALESCE(NULLIF(?, ''), name),
          email = COALESCE(NULLIF(?, ''), email),
          blog_title = COALESCE(NULLIF(?, ''), blog_title)
        WHERE id = ?`;

      const query_parameters = [
        new_name,
        new_email,
        new_blog_title,
        req.session.userId,
      ];

      if (new_password) {
        const hashedPassword = await bcrypt.hash(new_password, 10);
        query = `
          UPDATE users SET 
            name = COALESCE(NULLIF(?, ''), name),
            email = COALESCE(NULLIF(?, ''), email),
            password = ?,
            blog_title = COALESCE(NULLIF(?, ''), blog_title)
          WHERE id = ?`;
        query_parameters.splice(2, 0, hashedPassword); // Insert hashedPassword before blog_title and userId
      }

      global.db.run(query, query_parameters, function (err) {
        if (err) {
          next(err); //send the error on to the error handler
        } else {
          res.render("author/settings.ejs", {
            formValues: { ...req.body },
            errors: {},
            success: { general: "Settings updated successfully" },
          });
          next();
        }
      });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
