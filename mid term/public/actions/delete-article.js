function deleteArticle(articleId) {
  fetch(`/articles/${articleId}`, {
    method: "DELETE",
  })
    .then((response) => {
      if (response.ok) {
        // Optionally update UI or reload articles
      } else {
        // Handle error
      }
    })
    .catch((error) => {
      console.error("Error deleting article:", error);
    });
}
