// Science page functionality and quiz logic

/**
 * Handles the science quiz form submission
 * Checks the answers and displays the result
 * @returns {boolean} Always returns false to prevent form submission
 */
function checkQuiz() {
    const q1 = document.querySelector('input[name="q1"]:checked');
    const q2 = document.querySelector('input[name="q2"]:checked');
    const result = document.getElementById("quiz-result");

    // Check if all questions are answered
    if (!q1 || !q2) {
        result.textContent = "Please answer all questions!";
        result.className = "quiz-result-missing";
        return false;
    }

    // Check if answers are correct
    const correct = q1.value === "Mars" && q2.value === "Sunlight";
    
    // Display result
    result.textContent = correct
        ? "Great job! 🎉 You got them right!"
        : "Oops! Try again!";
    result.className = correct ? "quiz-result-success" : "quiz-result-error";

    // Scroll to make sure result is visible
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
    
    return false;
}

/**
 * Initialize the science page functionality
 */
function initSciencePage() {
    // Quiz form initialization
    const quizForm = document.getElementById("quiz-form");
    if (quizForm) {
        quizForm.addEventListener("submit", function(e) {
            e.preventDefault();
            checkQuiz();
        });
    }

    // Ensure quiz is visible
    const quizSection = document.getElementById("science-quiz");
    if (quizSection) {
        console.log("Science quiz found and ready!");
    }

    // Add hoverable facts interactions
    const factSpans = document.querySelectorAll('.fact-hover span');
    factSpans.forEach(span => {
        span.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        
        span.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
}

// Initialize when DOM is fully loaded
document.addEventListener("DOMContentLoaded", initSciencePage);