const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

/**
 * @desc Render the draft articles page with all the draft articles
 * @route GET /author/articles/draft
 * @returns Rendered HTML of the draft articles page with draftArticles
 */
router.get("/", async (req, res, next) => {
  try {
    const draftArticles = await new Promise((resolve, reject) => {
      global.db.all(
        "SELECT * FROM articles WHERE author_id = ? AND published_on IS NULL ORDER BY created_on DESC",
        [req.session.userId],
        (err, rows) => {
          if (err) {
            reject(err); // Reject on database error
          } else {
            resolve(rows); // Resolve with fetched rows (draft articles)
          }
        }
      );
    });

    // Render the draft articles page with fetched articles
    res.render("author/articles/draft.ejs", {
      draftArticles: draftArticles,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @desc Render the article creation form
 * @route GET /author/articles/draft/create
 * @returns Rendered HTML of the create article form
 */
router.get("/create", (req, res, next) => {
  try {
    res.render("author/articles/create.ejs", {
      formValues: {
        title: "",
        content: "",
        tags: "",
      },
      errors: {},
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @desc Create a new article
 * @route POST /author/articles/draft/create
 * @param title: Title of the article
 * @param content: Content of the article
 * @param tags: Tags of the article
 * @returns Redirect to the drafts page upon successful article creation
 * @throws Redirect to the create article form with errors if validation fails
 */
router.post("/create", (req, res, next) => {
  const { title, content, tags } = req.body;
  const authorId = req.session.userId;

  try {
    // Example validation - check if required fields are provided
    const errors = {};

    if (tags && tags.split(",").length < 3) {
      errors.tags = "At least 3 tags are required";
    }

    if (!authorId) {
      errors.general = "Please signin to create an article";
    }

    if (Object.keys(errors).length > 0) {
      // Render the form again with errors if validation fails
      res.render("author/articles/create.ejs", {
        formValues: { ...req.body },
        errors,
      });
    } else {
      // Insert the new article into the database
      const query =
        "INSERT INTO articles (title, content, tags, author_id) VALUES (?, ?, ?, ?)";
      const queryParameters = [title, content, tags, authorId];
      global.db.run(query, queryParameters, function (err) {
        if (err) {
          // Handle database insertion error
          return next(err); // Pass the error to the global error handler middleware
        } else {
          // Redirect to the drafts page upon successful article creation
          res.redirect("/author/articles/draft");
        }
      });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
