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
router.get("/", (req, res, next) => {
  res.render("author/home.ejs");
});

const publishedRoutes = require("./author/published");
router.use("/articles/published", publishedRoutes);

const draftRoutes = require("./author/draft");
router.use("/articles/draft", draftRoutes);

const authorSettings = require("./author/setting");
router.use("/settings", authorSettings);

router.get("/articles/:articleId/edit", async (req, res, next) => {
  const articleId = req.params.articleId;
  const article = await new Promise((resolve, reject) => {
    global.db.get(
      "SELECT * FROM articles WHERE id = ?",
      [articleId],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      }
    );
  });

  if (!article) {
    // Handle article not found
    return next(new Error("Article not found"));
  }

  res.render("author/articles/edit.ejs", {
    formValues: {
      id: article.id,
      title: article.title,
      content: article.content,
      tags: article.tags,
    },
    errors: {},
  });
});

router.post("/articles/:articleId/edit", (req, res, next) => {
  const { title, content, tags } = req.body;
  const articleId = req.params.articleId;

  const errors = {};

  if (tags && tags.split(",").length < 3) {
    errors.tags = "Atleast 3 tags are required";
  }

  if (Object.keys(errors).length > 0) {
    // Render the form again with errors
    res.render("author/articles/edit.ejs", {
      formValues: { ...req.body },
      errors,
    });
  }

  const query =
    "UPDATE articles SET title = ?, content = ?, tags = ?, published_on = ? WHERE id = ? AND author_id = ?";
  const queryParameters = [
    title,
    content,
    tags,
    null,
    articleId,
    req.session.userId,
  ];

  global.db.run(query, queryParameters, function (err) {
    if (err) {
      // Handle database insertion error
      return next(err); // Pass the error to the global error handler middleware
    }
    res.redirect("/author/articles/draft");
  });
});

router.put("/articles/:articleId/publish", (req, res, next) => {
  const articleId = req.params.articleId;
  const query =
    "UPDATE articles SET published_on = ? WHERE id = ? AND author_id = ?";
  const queryParameters = [
    // date format 2024-07-07 11:12:27
    new Date().toISOString().slice(0, 19).replace("T", " "),
    articleId,
    req.session.userId,
  ];

  global.db.run(query, queryParameters, function (err) {
    if (err) {
      return res
        .status(500)
        .send({ ok: false, message: "Failed to publish article" });
    }
    return res
      .status(200)
      .send({ ok: true, message: "Published article successfully" });
  });
});

router.delete("/articles/:articleId", (req, res, next) => {
  const articleId = req.params.articleId;
  const query = "DELETE FROM articles WHERE id = ? AND author_id = ?";
  const queryParameters = [articleId, req.session.userId];

  global.db.run(query, queryParameters, function (err) {
    if (err) {
      // Handle database insertion error
      res.send(500).send({ ok: false, message: "Failed to delete article" });
    }
    res.status(200).send({ ok: true, message: "Article deleted successfully" });
  });
});

// Export the router object so index.js can access it
module.exports = router;
