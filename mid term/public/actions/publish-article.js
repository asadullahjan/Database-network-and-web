function publishArticle(articleId) {
  fetch(`/articles/${articleId}/publish`, {
    method: "PUT",
  })
    .then((response) => {
      if (response.ok) {
        // Optionally update UI or reload articles
      } else {
        // Handle error
      }
    })
    .catch((error) => {
      console.error("Error publishing article:", error);
    });
}
