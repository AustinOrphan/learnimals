// Basic particle confetti on hover for gamification
const cards = document.querySelectorAll('.feature-card');

cards.forEach((card) => {
  card.addEventListener('mouseenter', () => {
    createConfetti(card);
  });
  card.addEventListener('mouseleave', () => {
    setTimeout(() => {
      card.querySelector('.confetti-container').remove();
    }, 3000);
  });
});

function createConfetti(container) {
  const confettiContainer = document.createElement('div');
  confettiContainer.classList.add('confetti-container');
  confettiContainer.style.position = 'absolute';
  confettiContainer.style.left = '0';
  confettiContainer.style.top = '0';
  confettiContainer.style.width = '100%';
  confettiContainer.style.height = '100%';
  confettiContainer.style.zIndex = '1'; // Negative z-index to stay below the image

  container.appendChild(confettiContainer);

  for (let i = 0; i < 100; i++) {
    const star = document.createElement('div');
    star.classList.add('confetti');
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.animationDelay = `${Math.random()}s`;
    confettiContainer.appendChild(star);
    setTimeout(() => star.remove(), 3000);
  }
}

// Add styles via JS so you don't have to maintain in CSS
const style = document.createElement('style');
style.innerHTML = `
  .confetti {
    position: absolute;
    width: 6px;
    height: 6px;
    background-color: var(--primary-color-alt);
    border-radius: 50%;
    opacity: 0;
    animation: pop 2s ease-out forwards;
    z-index: 1;
  }

  .confetti-container {
    z-index: 1;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
  }

  @keyframes pop {
    0% { transform: translateY(0) translateX(0); opacity: 0; height: 0; width: 0; }
    10% { transform: translateY(-10px) translateX(-3px); opacity: 1; height: 6px; width: 6px; }
    100% { transform: translateY(-40px) translateX(0); opacity: 0; height: 0; width: 0; }
  }
`;
document.head.appendChild(style);
