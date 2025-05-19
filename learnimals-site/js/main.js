// Basic particle confetti on hover for gamification
const cards = document.querySelectorAll('.feature-card');

cards.forEach(card => {
  card.addEventListener('mouseenter', () => {
    createConfetti(card);
  });
});

function createConfetti(container) {
  for (let i = 0; i < 20; i++) {
    const star = document.createElement('div');
    star.classList.add('confetti');
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.animationDelay = `${Math.random()}s`;
    container.appendChild(star);
    setTimeout(() => star.remove(), 1000);
  }
}

// Add styles via JS so you don't have to maintain in CSS
const style = document.createElement('style');
style.innerHTML = `
  .confetti {
    position: absolute;
    width: 6px;
    height: 6px;
    background-color: #fdcb6e;
    border-radius: 50%;
    animation: pop 0.8s ease-out forwards;
    pointer-events: none;
    z-index: 10;
  }

  @keyframes pop {
    0% { transform: scale(1) translateY(0); opacity: 1; }
    100% { transform: scale(0.5) translateY(-20px); opacity: 0; }
  }
`;
document.head.appendChild(style);