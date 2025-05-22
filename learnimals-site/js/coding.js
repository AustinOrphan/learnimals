// Example: Add a simple interactive greeting to the Coding page

document.addEventListener('DOMContentLoaded', function () {
    const header = document.querySelector('header');
    header.addEventListener('click', function () {
        alert('Welcome to Learnimals Coding!');
    });
});