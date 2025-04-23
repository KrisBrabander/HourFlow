(function () {
  const urlParams = new URLSearchParams(window.location.search);
  const license = urlParams.get('license') || localStorage.getItem('hourflowUser');

  if (!license || license.length < 5) {
    const input = prompt("Enter your license (email):");

    if (!input || input.length < 5) {
      alert("Access denied. Please purchase HourFlow from Gumroad.");
      window.location.href = "https://your-gumroad-link.com"; // replace with actual link
    } else {
      localStorage.setItem('hourflowUser', input);
    }
  }

  const display = localStorage.getItem("hourflowUser");
  const tag = document.createElement("div");
  tag.style = "position: fixed; bottom: 5px; right: 10px; font-size: 12px; color: gray; opacity: 0.6; z-index: 9999;";
  tag.textContent = `Licensed to: ${display}`;
  document.body.appendChild(tag);
})();
