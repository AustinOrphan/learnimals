// Basic particle confetti on hover for gamification
const cards = document.querySelectorAll(".feature-card");

cards.forEach((card) => {
  card.addEventListener("mouseenter", () => {
    createConfetti(card);
  });
});

function createConfetti(container) {
  const confettiContainer = document.createElement("div");
  confettiContainer.classList.add("confetti-container");
  confettiContainer.style.position = "absolute";
  confettiContainer.style.left = "0";
  confettiContainer.style.top = "0";
  confettiContainer.style.width = "100%";
  confettiContainer.style.height = "100%";
  confettiContainer.style.zIndex = "-1"; // Negative z-index to stay below the image

  // Insert at the beginning of the container to ensure it's behind other elements
  if (container.firstChild) {
    container.insertBefore(confettiContainer, container.firstChild);
  } else {
    container.appendChild(confettiContainer);
  }

  for (let i = 0; i < 100; i++) {
    const star = document.createElement("div");
    star.classList.add("confetti");
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.animationDelay = `${Math.random()}s`;
    confettiContainer.appendChild(star);
    setTimeout(() => star.remove(), 3000);
  }

  // Remove the confetti container after all confetti are gone
  setTimeout(() => confettiContainer.remove(), 3100);
}

// Add styles via JS so you don't have to maintain in CSS
const style = document.createElement("style");
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
    0% { transform: scale(0) translateY(0); opacity: 0; }
    10% { transform: scale(1) translateY(-4px); opacity: 1; }
    100% { transform: scale(0) translateY(-36px); opacity: 0; }
  }
`;
document.head.appendChild(style);
