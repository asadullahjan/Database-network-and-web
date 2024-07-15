function publishArticle(articleId) {
  fetch(`/author/articles/${articleId}/publish`, {
    method: "PUT",
  })
    .then(async (response) => {
      console.log("response", response);
      const responseText = await response.text();
      if (response.ok) {
        // Update UI
        removeArticleFromUI(articleId);

        showPopup(responseText, "success");
      } else {
        // Handle error
        showPopup(responseText, "error");
      }
    })
    .catch((error) => {
      console.error("Error publishing article:", error);
    });
}

function removeArticleFromUI(articleId) {
  // Assuming each article's DOM element has an id attribute `article-${articleId}`
  const articleElement = document.getElementById(`article-${articleId}`);
  if (articleElement) {
    articleElement.remove();
  }
}
