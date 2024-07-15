const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

/**
 * @desc Render the published articles page with all the published articles
 * @route GET /author/articles/published
 * @returns Rendered HTML of the published articles page
 * @returns publishedArticles: All the published articles of the logged in author
 * @returns protocol: Protocol of the request
 * @returns host: Host of the request
 */
router.get("/", async (req, res, next) => {
  try {
    const publishedArticles = await new Promise((resolve, reject) => {
      global.db.all(
        "SELECT * FROM articles WHERE author_id = ? AND published_on IS NOT NULL ORDER BY published_on DESC",
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

    res.render("author/articles/published.ejs", {
      publishedArticles: publishedArticles,
      protocol: req.protocol,
      host: req.get("host"),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
