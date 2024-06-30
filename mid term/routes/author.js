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
  res.render("author/articles/create-draft.ejs");
});

// Export the router object so index.js can access it
module.exports = router;
