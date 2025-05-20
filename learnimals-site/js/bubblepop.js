const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d", { alpha: false });

// Initialize game variables
let bubbles = [];
let currentQuestion = {};
let score = 0;
let message = "";
let messageTimer = null;
let messageColor = "#d9534f"; // Default color for wrong answer
let lastFrameTime = 0;
let gameActive = true;

// Responsive canvas sizing
function resizeCanvas() {
  const container = canvas.parentElement;
  const oldWidth = canvas.width;
  const oldHeight = canvas.height;

  canvas.width = Math.min(600, container.clientWidth - 20);
  canvas.height = 400;

  // Adjust bubble positions if canvas size changes
  if (
    bubbles.length > 0 &&
    (oldWidth !== canvas.width || oldHeight !== canvas.height)
  ) {
    const widthRatio = canvas.width / oldWidth;
    const heightRatio = canvas.height / oldHeight;

    bubbles.forEach((bubble) => {
      bubble.x *= widthRatio;
      bubble.y *= heightRatio;
    });
  }
}

// Initialize and resize on window load/resize
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Cached bubble graphics for performance
const bubbleCache = {};

// Pre-render bubble background
function createBubbleBackground(radius) {
  const cacheKey = `bubble_${radius}`;

  if (!bubbleCache[cacheKey]) {
    const bubbleCanvas = document.createElement("canvas");
    bubbleCanvas.width = radius * 2 + 4; // Add padding for stroke
    bubbleCanvas.height = radius * 2 + 4;
    const bubbleCtx = bubbleCanvas.getContext("2d");

    bubbleCtx.beginPath();
    bubbleCtx.arc(radius + 2, radius + 2, radius, 0, Math.PI * 2);
    bubbleCtx.fillStyle = "#a2e8ff";
    bubbleCtx.fill();
    bubbleCtx.strokeStyle = "#008cba";
    bubbleCtx.lineWidth = 2;
    bubbleCtx.stroke();
    bubbleCtx.closePath();

    bubbleCache[cacheKey] = bubbleCanvas;
  }

  return bubbleCache[cacheKey];
}

// Bubble object with optimized rendering
class Bubble {
  constructor(x, y, radius, answer, isCorrect) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.answer = answer;
    this.isCorrect = isCorrect;
    this.speed = Math.random() * 0.75 + 1;
    this.active = true;
    this.bubbleBackground = createBubbleBackground(radius);
  }

  draw() {
    // Draw pre-rendered bubble background
    ctx.drawImage(
      this.bubbleBackground,
      this.x - this.radius - 2,
      this.y - this.radius - 2,
    );

    // Draw text
    ctx.fillStyle = "#000";
    ctx.font = "20px Comic Sans MS, Comic Sans, cursive";
    ctx.textAlign = "center";
    ctx.fillText(this.answer, this.x, this.y + 5);
  }

  update(deltaTime) {
    // Time-based movement for consistent speed across devices
    this.y -= this.speed * (deltaTime / 16.67); // Normalized to ~60 FPS
    this.draw();

    // Mark as inactive if out of canvas
    if (this.y + this.radius < 0) {
      this.active = false;
    }
  }
}

// Generate a simple math question
function generateQuestion() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  currentQuestion = {
    text: `${a} + ${b}`,
    answer: a + b,
  };
}

// Create bubbles
function spawnBubbles() {
  bubbles = [];
  const correctPos = Math.floor(Math.random() * 4);
  const spacing = canvas.width / 5;

  for (let i = 0; i < 4; i++) {
    const radius = 30;
    // Distribute bubbles evenly across canvas width with proper spacing
    const x = spacing * (i + 1);
    const y = canvas.height - 40;
    let answer;

    if (i === correctPos) {
      answer = currentQuestion.answer;
    } else {
      do {
        answer = currentQuestion.answer + Math.floor(Math.random() * 10 - 5);
      } while (
        answer === currentQuestion.answer ||
        answer < 0 ||
        bubbles.some((b) => b.answer === answer)
      );
    }

    const isCorrect = answer === currentQuestion.answer;
    bubbles.push(new Bubble(x, y, radius, answer, isCorrect));
  }
}

// Touch and click handling
function handlePointerEvent(e) {
  if (!gameActive) return;

  e.preventDefault();

  const rect = canvas.getBoundingClientRect();
  const scale = canvas.width / rect.width; // Handle HiDPI displays

  // Get pointer position (works for both touch and mouse)
  let clickX, clickY;
  if (e.type.startsWith("touch")) {
    clickX = (e.touches[0].clientX - rect.left) * scale;
    clickY = (e.touches[0].clientY - rect.top) * scale;
  } else {
    clickX = (e.clientX - rect.left) * scale;
    clickY = (e.clientY - rect.top) * scale;
  }

  // Check collision with bubbles
  for (let i = 0; i < bubbles.length; i++) {
    const b = bubbles[i];
    const dx = b.x - clickX;
    const dy = b.y - clickY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < b.radius) {
      if (b.isCorrect) {
        score++;
        message = "Correct! Well done!";
        messageColor = "#5cb85c"; // Green color for correct answer
        // Clear the bubbles and spawn new ones
        nextRound();
      } else {
        message = "Oops! Try again."; // Message disappears after 1 second
        messageColor = "#d9534f"; // Red color for wrong answer
      }
      // Clear previous message timer if it exists
      clearTimeout(messageTimer);
      messageTimer = setTimeout(() => {
        message = "";
      }, 1000);
      break;
    }
  }
}

// Add event listeners for both mouse and touch
canvas.addEventListener("click", handlePointerEvent);
canvas.addEventListener("touchstart", handlePointerEvent, { passive: false });

function nextRound() {
  generateQuestion();
  spawnBubbles();
}

// Pause game when tab/window is inactive
document.addEventListener("visibilitychange", () => {
  gameActive = !document.hidden;
});

// Game loop with time-based animation
function animate(timestamp) {
  // Calculate delta time for smooth animation
  const deltaTime = timestamp - (lastFrameTime || timestamp);
  lastFrameTime = timestamp;

  // Handle window resizing
  resizeCanvas();

  // Skip frames if tab is inactive
  if (!gameActive) {
    requestAnimationFrame(animate);
    return;
  }

  // Clear canvas and set background color based on theme
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Apply theme-based background
  const isDarkTheme =
    document.documentElement.getAttribute("data-theme") === "night";
  ctx.fillStyle = isDarkTheme ? "#2d3436" : "#e0f7fa";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw game UI with shadow effect for better readability
  ctx.font = "20px Comic Sans MS, Comic Sans, cursive";
  ctx.fillStyle = "#333";
  ctx.textAlign = "left";
  ctx.shadowColor = "rgba(255, 255, 255, 0.7)";
  ctx.shadowBlur = 4;
  ctx.fillText(`Score: ${score}`, 10, 35);
  ctx.fillText(`Solve: ${currentQuestion.text}`, 10, 60);
  ctx.shadowBlur = 0;

  // Draw message if present
  if (message) {
    ctx.font = "24px Comic Sans MS, Comic Sans, cursive";
    ctx.fillStyle = messageColor;
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(255, 255, 255, 0.7)";
    ctx.shadowBlur = 6;
    // Position message in the middle of the canvas
    ctx.fillText(message, canvas.width / 2, canvas.height / 2 - 50);
    ctx.shadowBlur = 0;
    ctx.textAlign = "left"; // Reset alignment
  }

  // Update bubbles with time-based movement
  let missedCorrect = false;

  bubbles.forEach((b) => {
    b.update(deltaTime);
    if (!b.active && b.isCorrect) {
      missedCorrect = true;
    }
  });

  // Remove inactive bubbles using efficient filter
  bubbles = bubbles.filter((b) => b.active);

  // If the correct bubble was missed, show message and start next round
  if (missedCorrect) {
    message = "Oops! The correct answer got away!";
    messageColor = "#d9534f";
    clearTimeout(messageTimer);
    messageTimer = setTimeout(() => {
      message = "";
    }, 1000);
    nextRound();
  }

  requestAnimationFrame(animate);
}

// Add pause/resume functionality
function pauseGame() {
  gameActive = false;
}

function resumeGame() {
  if (!gameActive) {
    gameActive = true;
    lastFrameTime = performance.now();
    requestAnimationFrame(animate);
  }
}

// Handle window focus/blur
window.addEventListener("blur", pauseGame);
window.addEventListener("focus", resumeGame);

// Start game
generateQuestion();
spawnBubbles();
requestAnimationFrame(animate);

// Add event listener to handle visibility change
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    pauseGame();
  } else {
    resumeGame();
  }
});

// Listen for theme changes to update canvas immediately
document.addEventListener("themeChanged", () => {
  // Force a new animation frame to update the canvas with the new theme
  if (gameActive) {
    requestAnimationFrame(animate);
  }
});
