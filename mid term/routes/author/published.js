const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

router.get("/", async (req, res, next) => {
  const publishedArticles = await new Promise((resolve, reject) => {
    global.db.all(
      "SELECT * FROM articles WHERE author_id = ? AND published_on IS NOT NULL",
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
  });
});

module.exports = router;
