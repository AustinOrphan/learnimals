// js/components/navbarLoader.js
fetch('../navbar.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById('navbar-placeholder').innerHTML = data;
  });
