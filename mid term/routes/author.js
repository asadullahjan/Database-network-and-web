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

router.get("/articles/published", (req, res, next) => {
  res.render("author/articles/published.ejs", {
    publishedArticles: [
      {
        id: 1,
        title: "Article 1",
        content: "This is the first article",
        publishedOn: "2021-10-01",
        createdOn: "2021-09-01",
        updatedOn: "2021-09-15",
        likes: 10,
        views: 100,
      },
      {
        id: 2,
        title: "Article 2",
        content: "This is the second article",
        publishedOn: "2021-10-05",
        createdOn: "2021-09-05",
        updatedOn: "2021-09-20",
        likes: 20,
        views: 200,
      },
    ],
  });
});

router.get("/articles/draft", (req, res, next) => {
  res.render("author/articles/draft.ejs", {
    draftArticles: [
      {
        id: 1,
        title: "Article 1",
        content: "This is the first draft article",
        createdOn: "2021-09-01",
        updatedOn: "2021-09-15",
      },
      {
        id: 2,
        title: "Article 2",
        content: "This is the second draft article",
        createdOn: "2021-09-05",
        updatedOn: "2021-09-20",
      },
      {
        id: 2,
        title: "Article 2",
        content: "This is the second draft article",
        createdOn: "2021-09-05",
        updatedOn: "2021-09-20",
      },
      {
        id: 2,
        title: "Article 2",
        content: "This is the second draft article",
        createdOn: "2021-09-05",
        updatedOn: "2021-09-20",
      },
      {
        id: 2,
        title: "Article 2",
        content: "This is the second draft article",
        createdOn: "2021-09-05",
        updatedOn: "2021-09-20",
      },
      {
        id: 2,
        title: "Article 2",
        content: "This is the second draft article",
        createdOn: "2021-09-05",
        updatedOn: "2021-09-20",
      },
      {
        id: 2,
        title: "Article 2",
        content: "This is the second draft article",
        createdOn: "2021-09-05",
        updatedOn: "2021-09-20",
      },
      {
        id: 2,
        title: "Article 2",
        content: "This is the second draft article",
        createdOn: "2021-09-05",
        updatedOn: "2021-09-20",
      },
    ],
  });
});

router.get("/articles/create-draft", (req, res, next) => {
  res.render("author/articles/create-draft.ejs", {
    formValues: {
      title: "",
      content: "",
      tags: "",
    },
    errors: {},
  });
});

router.post("/articles/create-draft", (req, res, next) => {
  const { title, content, tags } = req.body;
  const authorId = req.session.userId;

  // Example validation - check if required fields are provided
  const errors = {};
  if (!title) {
    errors.title = "Title is required";
  }
  if (!content) {
    errors.content = "Content is required";
  }
  if (!tags) {
    errors.tags = "Tags are required";
  }

  if (tags && tags.split(",").length < 3) {
    errors.tags = "Atleast 3 tags are required";
  }

  if (!authorId) {
    errors.general = "Please login to create an article";
  }

  if (Object.keys(errors).length > 0) {
    // Render the form again with errors
    res.render("author/articles/create-draft.ejs", {
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

router.put("/articles/:articleId/publish", (req, res, next) => {
  const articleId = req.params.articleId;
  const query = "UPDATE articles SET published = ? WHERE id = ?";
  const queryParameters = [currentTime(), articleId];

  global.db.run(query, queryParameters, function (err) {
    if (err) {
      // Handle database insertion error
      return next(err); // Pass the error to the global error handler middleware
    }
    res.status(200).send("Article published successfully");
  });
});

router.delete("/articles/:articleId", (req, res, next) => {
  const articleId = req.params.articleId;
  const query = "DELETE FROM articles WHERE id = ?";
  const queryParameters = [articleId];

  global.db.run(query, queryParameters, function (err) {
    if (err) {
      // Handle database insertion error
      return next(err); // Pass the error to the global error handler middleware
    }
    res.status(200).send("Article deleted successfully");
  });
});

router.get("/settings", (req, res, next) => {
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

router.post("/settings", async (req, res, next) => {
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

// Export the router object so index.js can access it
module.exports = router;
