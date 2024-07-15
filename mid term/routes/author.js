const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

/**
 * Displays the author's home page.
 * @route GET /
 * @returns {View} Rendered author home page
 */
router.get("/", (req, res, next) => {
  try {
    res.render("author/home.ejs");
  } catch (err) {
    next(err);
  }
});

const publishedRoutes = require("./author/published");
router.use("/articles/published", publishedRoutes);

const draftRoutes = require("./author/draft");
router.use("/articles/draft", draftRoutes);

const authorSettings = require("./author/setting");
router.use("/settings", authorSettings);

/**
 * Renders the article edit form.
 * @route GET /articles/:articleId/edit
 * @param {String} req.params.articleId - ID of the article to edit
 * @returns {View} Rendered article edit form with form values
 */
router.get("/articles/:articleId/edit", async (req, res, next) => {
  const articleId = req.params.articleId;
  try {
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
        created_on: article.created_on,
        updated_on: article.updated_on,
      },
      errors: {},
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Handles editing an article.
 * @route POST /articles/:articleId/edit
 * @param {String} req.params.articleId - ID of the article to edit
 * @param {String} req.body.title - Title of the article
 * @param {String} req.body.content - Content of the article
 * @param {String} req.body.tags - Tags of the article
 * @returns {Response} Redirects to draft articles or renders edit form with errors
 */
router.post("/articles/:articleId/edit", (req, res, next) => {
  const { title, content, tags } = req.body;
  const articleId = req.params.articleId;

  const errors = {};

  if (tags && tags.split(",").length < 3) {
    errors.tags = "At least 3 tags are required";
  }

  if (Object.keys(errors).length > 0) {
    // Render the form again with errors
    return res.render("author/articles/edit.ejs", {
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

  try {
    global.db.run(query, queryParameters, function (err) {
      if (err) {
        // Handle database update error
        return next(err); // Pass the error to the global error handler middleware
      }
      res.redirect("/author/articles/draft");
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Handles publishing an article.
 * @route PUT /articles/:articleId/publish
 * @param {String} req.params.articleId - ID of the article to publish
 * @returns {Response} Success or error message
 */
router.put("/articles/:articleId/publish", (req, res, next) => {
  const articleId = req.params.articleId;
  const user = res.locals.user;
  const hasBlogTitle = user.blog_title;

  if (!hasBlogTitle) {
    return res.status(400).send("Please set your blog title first");
  }

  const isAuthorized = user.role === "AUTHOR" || user.role === "ADMIN";
  if (!isAuthorized) {
    return res.status(401).send("Please contact the admin to become an author");
  }

  const query =
    "UPDATE articles SET published_on = ? WHERE id = ? AND author_id = ?";
  const queryParameters = [
    new Date().toISOString().slice(0, 19).replace("T", " "),
    articleId,
    req.session.userId,
  ];

  try {
    global.db.run(query, queryParameters, function (err) {
      if (err) {
        return res.status(500).send("Failed to publish article");
      }
      return res.status(200).send("Published article successfully");
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Handles deleting an article.
 * @route DELETE /articles/:articleId
 * @param {String} req.params.articleId - ID of the article to delete
 * @returns {Response} Success or error message
 */
router.delete("/articles/:articleId", (req, res, next) => {
  const articleId = req.params.articleId;
  const query = "DELETE FROM articles WHERE id = ? AND author_id = ?";
  const queryParameters = [articleId, req.session.userId];

  try {
    global.db.run(query, queryParameters, function (err) {
      if (err) {
        // Handle database deletion error
        return res
          .status(500)
          .send({ ok: false, message: "Failed to delete article" });
      }
      return res
        .status(200)
        .send({ ok: true, message: "Article deleted successfully" });
    });
  } catch (err) {
    next(err);
  }
});

// Export the router object so index.js can access it
module.exports = router;
