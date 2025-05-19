const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 600;
canvas.height = 400;

let bubbles = [];
let currentQuestion = {};
let score = 0;

// Bubble object
class Bubble {
  constructor(x, y, radius, answer, isCorrect) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.answer = answer;
    this.isCorrect = isCorrect;
    this.speed = Math.random() * 1 + 0.5;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#a2e8ff";
    ctx.fill();
    ctx.strokeStyle = "#008cba";
    ctx.stroke();
    ctx.closePath();
    ctx.fillStyle = "#000";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(this.answer, this.x, this.y + 5);
  }

  update() {
    this.y -= this.speed;
    this.draw();
  }
}

// Generate a simple math question
function generateQuestion() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  currentQuestion = {
    text: `${a} + ${b}`,
    answer: a + b
  };
}

// Create bubbles
function spawnBubbles() {
  bubbles = [];
  const correctPos = Math.floor(Math.random() * 4);
  for (let i = 0; i < 4; i++) {
    const radius = 30;
    const x = 80 + i * 120;
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
        bubbles.some(b => b.answer === answer)
        );
    }

    const isCorrect = answer === currentQuestion.answer;
    bubbles.push(new Bubble(x, y, radius, answer, isCorrect));
  }
}

// Handle bubble click
canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  for (let i = 0; i < bubbles.length; i++) {
    const b = bubbles[i];
    const dx = b.x - clickX;
    const dy = b.y - clickY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < b.radius) {
      if (b.isCorrect) {
        score++;
        nextRound();
      } else {
        alert("Oops! Try again.");
      }
      break;
    }
  }
});

function nextRound() {
  generateQuestion();
  spawnBubbles();
}

// Game loop
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "20px Arial";
  ctx.fillStyle = "#333";
  ctx.fillText(`Score: ${score}`, 40, 35);
  ctx.fillText(`Solve: ${currentQuestion.text}`, 55, 60);


  bubbles.forEach((b) => b.update());
  requestAnimationFrame(animate);
}

// Start game
generateQuestion();
spawnBubbles();
animate();
