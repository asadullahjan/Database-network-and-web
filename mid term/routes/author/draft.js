const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

router.get("/", async (req, res, next) => {
  const draftArticles = await new Promise((resolve, reject) => {
    global.db.all(
      "SELECT * FROM articles WHERE author_id = ? AND published_on IS NULL",
      [req.session.userId],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });

  console.log("draftArticles", draftArticles);
  res.render("author/articles/draft.ejs", {
    draftArticles: draftArticles,
    messages: {}
  });
});

router.get("/create", (req, res, next) => {
  res.render("author/articles/create.ejs", {
    formValues: {
      title: "",
      content: "",
      tags: "",
    },
    errors: {},
  });
});

router.post("/create", (req, res, next) => {
  const { title, content, tags } = req.body;
  const authorId = req.session.userId;

  // Example validation - check if required fields are provided
  const errors = {};

  if (tags && tags.split(",").length < 3) {
    errors.tags = "Atleast 3 tags are required";
  }

  if (!authorId) {
    errors.general = "Please login to create an article";
  }

  if (Object.keys(errors).length > 0) {
    // Render the form again with errors
    res.render("author/articles/create.ejs", {
      formValues: { ...req.body },
      errors,
    });
  } else {
    const query =
      "INSERT INTO articles (title, content, tags, author_id) VALUES (?, ?, ?, ?)";
    const queryParameters = [title, content, tags, authorId];
    global.db.run(query, queryParameters, function (err) {
      if (err) {
        // Handle database insertion error
        return next(err); // Pass the error to the global error handler middleware
      } else {
        // Successful insertion, redirect to a success page or another route
        res.redirect("/author/articles/draft");
      }
    });
  }
});

module.exports = router;
