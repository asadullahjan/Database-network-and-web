const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

/**
 * @desc Fetches published articles based on search query and renders the home page.
 * @route GET /articles
 * @param {String} req.query.search - Optional search query for filtering articles
 * @returns {HTML} Rendered home page with published articles
 */
router.get("/", async (req, res) => {
  const searchQuery = req.query?.search || "";
  try {
    const publishedArticles = await new Promise((resolve, reject) => {
      const query = `
        SELECT 
          articles.id,
          articles.title,
          articles.published_on,
          articles.created_on,
          articles.updated_on,
          articles.views,
          articles.likes,
          articles.tags,
          users.name AS author_name,
          users.blog_title AS blog_title
        FROM articles
        JOIN users ON articles.author_id = users.id
        WHERE articles.published_on IS NOT NULL
         AND (
          articles.title LIKE ? OR 
          users.name LIKE ? OR 
          users.blog_title LIKE ? OR
          articles.published_on LIKE ? OR
          articles.tags LIKE ?
        )
        ORDER BY articles.published_on DESC
      `;

      const queryParams = [
        `%${searchQuery}%`,
        `%${searchQuery}%`,
        `%${searchQuery}%`,
        `%${searchQuery}%`,
        `%${searchQuery}%`,
      ];

      global.db.all(query, queryParams, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    res.render("articles/home.ejs", {
      publishedArticles: publishedArticles,
      search: searchQuery,
      protocol: req.protocol,
      host: req.get("host"),
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

/**
 * @desc Fetches article details, comments, and checks if the article is liked by the user.
 * @route GET /articles/:articleId
 * @param {String} req.params.articleId - ID of the article to fetch
 * @returns {HTML} Rendered article page with article details, comments, and like status
 * @throws {Error} Renders error page if article is not found or encounters internal error
 */
router.get("/:articleId", async (req, res) => {
  const articleId = req.params.articleId;

  try {
    // Fetch article details
    const article = await new Promise((resolve, reject) => {
      const query = `
        SELECT
          articles.id,
          articles.title,
          articles.content,
          articles.published_on,
          articles.created_on,
          articles.updated_on,
          articles.views,
          articles.likes,
          articles.tags,
          users.name AS author_name,
          users.blog_title AS blog_title
        FROM articles
        JOIN users ON articles.author_id = users.id
        WHERE articles.id = ?
      `;

      global.db.get(query, [articleId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    // Fetch article comments
    const comments = await new Promise((resolve, reject) => {
      const query = `
        SELECT
          comments.id,
          comments.content,
          comments.created_on,
          users.name AS author_name
        FROM comments
        JOIN users ON comments.user_id = users.id
        WHERE comments.article_id = ?
        ORDER BY comments.created_on DESC
      `;

      global.db.all(query, [articleId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    // Fetch article likes
    const liked = await new Promise((resolve, reject) => {
      const query = `
        SELECT
          COUNT(*) AS liked
        FROM likes
        WHERE article_id = ? AND user_id = ?
      `;

      global.db.get(query, [articleId, req.session.userId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.liked);
        }
      });
    });

    if (!article) {
      // Handle article not found
      res.render("articles/article.ejs", {
        article: null,
        errors: { general: "Article not found" },
        protocol: req.protocol,
        host: req.get("host"),
      });
      return;
    } else {
      // Increment views count
      global.db.run(
        "UPDATE articles SET views = views + 1 WHERE id = ?",
        [articleId],
        (err) => {
          if (err) {
            console.error("Error updating article views", err);
          }
        }
      );
    }

    // Render the article page
    res.render("articles/article.ejs", {
      article: { ...article, comments, liked: liked > 0 },
      errors: {},
      protocol: req.protocol,
      host: req.get("host"),
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

/**
 * @desc Handles liking an article by a user.
 * @route POST /articles/:articleId/like
 * @param {String} req.params.articleId - ID of the article to like
 * @param {String} req.session.userId - User ID liking the article
 * @returns {Response} Success message or error status if user is not authenticated or article is already liked
 */
router.post("/:articleId/like", async (req, res) => {
  const articleId = req.params.articleId;
  const user = req.session.userId;

  if (!user) {
    return res.status(401).send("Please signin to like an article");
  }

  const alreadyLiked = await new Promise((resolve, reject) => {
    global.db.get(
      "SELECT COUNT(*) AS liked FROM likes WHERE article_id = ? AND user_id = ?",
      [articleId, user],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.liked);
        }
      }
    );
  });

  if (alreadyLiked) {
    return res.status(400).send("Article already liked");
  }

  global.db.run(
    "INSERT INTO likes (article_id, user_id) VALUES (?, ?)",
    [articleId, user],
    (err) => {
      if (err) {
        console.error("Error liking article", err);
        res.status(500).send("Error liking article");
      } else {
        res.status(200).send("Article liked");
      }
    }
  );

  global.db.run(
    "UPDATE articles SET likes = likes + 1 WHERE id = ?",
    [articleId],
    (err) => {
      if (err) {
        console.error("Error updating article likes", err);
      }
    }
  );
});

/**
 * @desc Handles adding a comment to an article.
 * @route POST /articles/:articleId/comment
 * @param {String} req.params.articleId - ID of the article to comment on
 * @param {String} req.session.userId - User ID commenting on the article
 * @param {String} req.body.content - Content of the comment
 * @returns {Response} Success message or error status if user is not authenticated
 */
router.post("/:articleId/comment", async (req, res) => {
  const articleId = req.params.articleId;
  const user = req.session.userId;
  const { content } = await req.body;

  if (!user) {
    return res.status(401).send("Please signin to comment");
  }

  global.db.run(
    "INSERT INTO comments (article_id, user_id, content) VALUES (?, ?, ?)",
    [articleId, user, content],
    (err) => {
      if (err) {
        console.error("Error adding comment", err);
        res.status(500).send("Error adding comment");
      } else {
        res.status(200).send("Comment added");
      }
    }
  );
});

module.exports = router;
