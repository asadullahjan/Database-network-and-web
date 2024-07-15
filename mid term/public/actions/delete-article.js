
function deleteArticle(articleId) {
  fetch(`/author/articles/${articleId}`, {
    method: "DELETE",
  })
    .then((response) => {
      if (response.ok) {
        // Optionally update UI or reload articles
        showPopup("Article deleted successfully", "success");

        // Remove article from UI
        removeArticleFromUI(articleId);
      } else {
        // Handle error
        showPopup("Failed to delete article", "error");
      }
    })
    .catch((error) => {
      console.error("Error deleting article:", error);
    });
}

function removeArticleFromUI(articleId) {
  // Assuming each article's DOM element has an id attribute `article-${articleId}`
  const articleElement = document.getElementById(`article-${articleId}`);
  if (articleElement) {
    articleElement.remove();
  }
}
