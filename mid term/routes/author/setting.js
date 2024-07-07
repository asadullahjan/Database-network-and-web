const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

router.get("/", (req, res, next) => {
  const user = global.db.get(
    "SELECT name, email, blog_title FROM users WHERE id = ?",
    req.session.userId
  );

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
  });
});

router.post("/", async (req, res, next) => {
  // Define the query
  const { new_name, new_blog_title, new_email, old_password, new_password } =
    req.body;
  const hashedPassword = await bcrypt.hash(new_password, 10);

  const userPassword = await global.db.get(
    "SELECT password FROM users WHERE id = ?",
    req.session.userId
  );

  const errors = {};
  if (
    new_password &&
    new_password !== "" &&
    !(await bcrypt.compare(old_password, userPassword))
  ) {
    errors.old_password = "Old password is incorrect";
  }

  if (!req.session.userId) {
    errors.general = "Please login to update your settings";
  }

  if (Object.keys(errors).length > 0) {
    // Render the form again with errors
    res.render("author/settings.ejs", {
      formValues: { ...req.body },
      errors,
    });
  } else {
    query = `
    UPDATE users SET 
      name = CASE WHEN ? IS NULL OR ? = '' THEN name ELSE ? END,
      email = CASE WHEN ? IS NULL OR ? = '' THEN email ELSE ? END,
      password = CASE WHEN ? IS NULL OR ? = '' THEN password ELSE ? END,
      blog_title = CASE WHEN ? IS NULL OR ? = '' THEN blog_title ELSE ? END
    WHERE id = ?`;

    query_parameters = [
      new_name,
      new_email,
      hashedPassword,
      new_blog_title,
      req.session.userId,
    ];

    // Execute the query and send a confirmation message
    global.db.run(query, query_parameters, function (err) {
      if (err) {
        next(err); //send the error on to the error handler
      } else {
        res.redirect("/author/settings"); // Redirect to user profile or dashboard
        next();
      }
    });
  }
});

module.exports = router;