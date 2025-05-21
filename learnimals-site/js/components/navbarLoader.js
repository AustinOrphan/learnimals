// js/components/navbarLoader.js
fetch("/learnimals-site/components/navbar.html")
  .then((res) => res.text())
  .then((data) => {
    document.getElementById("navbar-placeholder").innerHTML = data;
  });
