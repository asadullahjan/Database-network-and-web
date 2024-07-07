function showPopup(message, type) {
  const popup = document.getElementById('popupMessage');
  const popupText = document.getElementById('popupText');

  popupText.textContent = message;
  popup.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white text-sm p-4 rounded-md shadow-md'; // Reset to default classes

  if (type === 'success') {
    popup.style.backgroundColor = '#34D399'; // Custom color for success
    popup.style.color = '#1F2937'; // Custom color for success
  } else if (type === 'error') {
    popup.style.backgroundColor = '#EF4444'; // Custom color for error
    popup.style.color = '#1F2937'; // Custom color for error
  }

  popup.style.display = 'block'; // Show the popup

  setTimeout(() => {
    popup.style.display = 'none'; // Hide the popup after 4 seconds
  }, 4000); // Adjust timeout duration (in milliseconds) as needed
}