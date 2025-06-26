// Example: Add a simple interactive greeting to the Coding page

document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('header');
  header.addEventListener('click', () => {
    alert('Welcome to Learnimals Coding!');
  });
});