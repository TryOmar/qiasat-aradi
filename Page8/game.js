function showPopup(text) {
// Create overlay
const overlay = document.createElement("div");
overlay.className = "dark-popup-overlay";

// Create popup container
const popup = document.createElement("div");
popup.className = "dark-popup";

// Create close button
const closeButton = document.createElement("button");
closeButton.className = "dark-popup-close";
closeButton.innerHTML = "×";

// Create content
const content = document.createElement("div");
content.className = "dark-popup-content";
content.textContent = text;

// Assemble popup
popup.appendChild(closeButton);
popup.appendChild(content);
overlay.appendChild(popup);
document.body.appendChild(overlay);

// Trigger animation
requestAnimationFrame(() => {
    overlay.classList.add("active");
    popup.classList.add("active");
});

// Handle closing
function closePopup() {
    overlay.classList.remove("active");
    popup.classList.remove("active");

    // Remove elements after animation
    setTimeout(() => {
    document.body.removeChild(overlay);
    }, 300);
}

closeButton.addEventListener("click", closePopup);
overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
    closePopup();
    }
});

// Close on escape key
document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
    closePopup();
    }
});
}



let currentGameQuestion = {}; // Store the current question object
let currentRound = 0;
let roundScore = 0;
let correctAnswers = 0;
let timer;
let timeLeft = 120;
let landPoints = 0;

// Function to update the scoreboard table
function updateScoreboard() {
return;
const tableBody = document
    .getElementById("rounds-table")
    .getElementsByTagName("tbody")[0];
tableBody.innerHTML = ""; // Clear the existing table

gameQuestions.forEach((game, index) => {
    const row = document.createElement("tr");
    if (index === currentRound) {
    row.classList.add("highlight"); // Highlight the current round
    }

    const scoreCell = document.createElement("td");
    scoreCell.textContent = game.score;
    row.appendChild(scoreCell);

    const questionCell = document.createElement("td");
    questionCell.textContent = `${index + 1}`;
    row.appendChild(questionCell);

    tableBody.appendChild(row);
});
}

function getRandomQuestionAndRemove(listName) {
if (questions[listName]?.length) {
    const randomIndex = Math.floor(
    Math.random() * questions[listName].length
    );
    const randomQuestion = questions[listName].splice(randomIndex, 1)[0]; // Remove and return question
    return randomQuestion;
}
return null;
}

// Function to shuffle array while keeping track of original indices
function shuffleAnswers(answers, correctIndex) {
    const indexedAnswers = answers.map((answer, index) => ({
        answer,
        isCorrect: index === correctIndex
    }));
    
    // Fisher-Yates shuffle
    for (let i = indexedAnswers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indexedAnswers[i], indexedAnswers[j]] = [indexedAnswers[j], indexedAnswers[i]];
    }
    
    // Find new correct index
    const newCorrectIndex = indexedAnswers.findIndex(item => item.isCorrect);
    
    return {
        shuffledAnswers: indexedAnswers.map(item => item.answer),
        newCorrectIndex
    };
}

function loadNextQuestion() {
if (correctAnswers === 15) {
//   alert("مبروك! لقد ربحت ٥٠ فدانًا!");
    showPopup("مبروك! لقد ربحت ٥٠ فدانًا!");
    return;
}

if (currentRound >= gameQuestions.length) {
//   alert("لقد انتهت الأسئلة!");
    showPopup("لقد انتهت الأسئلة!");
    return;
}

let q = null;
while (currentRound < gameQuestions.length && !q) {
    const currentGame = gameQuestions[currentRound];
    const listName = currentGame.list;
    roundScore = currentGame.score;

    q = getRandomQuestionAndRemove(listName);
    
    if (!q) {
    currentRound++; // Move to next list if current one is empty
    }
}

if (q) {
    // Assign the selected question to currentGameQuestion
    currentGameQuestion = q;

    // Shuffle the answers and get new correct index
    const { shuffledAnswers, newCorrectIndex } = shuffleAnswers(q.answers, q.correct);
    q.answers = shuffledAnswers;
    q.correct = newCorrectIndex;

    // Reset timer and update UI
    resetTimer();
    document.getElementById("question").textContent = q.question;
    document.getElementById("question-number").textContent = `السؤال ${
    correctAnswers + 1
    }`;

    // Log the correct answer and its option number for debugging
    console.log('Correct answer:', `Option ${q.correct + 1}:`, q.answers[q.correct]);

    const answers = document.querySelectorAll(".answer");
    answers.forEach((answer, index) => {
    answer.style.display = "block";
    answer.textContent = q.answers[index];
    answer.onclick = () => checkAnswer(answer, index === q.correct);
    });

    // Update the scoreboard table
    updateScoreboard();

    startTimer();
    saveGameState(); // Save state after loading new question
} else {
    showPopup("لا توجد المزيد من الأسئلة المتاحة");
}
}

function startTimer() {
document.getElementById("timer").textContent = timeLeft;
timer = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").textContent = timeLeft;
    if (timeLeft <= 0) {
    clearInterval(timer);
    // alert("انتهى الوقت! حاول مرة أخرى.");
    showPopup("انتهى الوقت! حاول مرة أخرى.");
    resetGame();
    }
}, 1000);
}

function resetTimer() {
clearInterval(timer);
timeLeft = 120;
}

function resetTimer() {
clearInterval(timer);
timeLeft = 120;
}

function checkAnswer(selectedAnswer, isCorrect) {
resetTimer();
if (isCorrect) {
    correctAnswers++;
    landPoints += roundScore;
    document.getElementById("correct-answers").textContent =
    correctAnswers;
    document.getElementById("land-points").textContent =
    landPoints.toFixed(2);
    selectedAnswer.classList.add("correct");
    saveGameState(); // Save state after correct answer
} else {
    showPopup("إجابة خاطئة! لقد خسرت جميع الفدادين.");
    resetGame();
    return;
}

setTimeout(() => {
    selectedAnswer.classList.remove("correct", "wrong");
    currentRound++; // Move to the next round
    loadNextQuestion();
}, 1000);
}

function resetGame() {
correctAnswers = 0;
landPoints = 0;
document.getElementById("correct-answers").textContent = correctAnswers;
document.getElementById("land-points").textContent =
    landPoints.toFixed(2);
resetTimer();
currentRound = 0; // Reset round to 0
loadNextQuestion();
}

function resetGame() {
correctAnswers = 0;
landPoints = 0;
document.getElementById("correct-answers").textContent = correctAnswers;
document.getElementById("land-points").textContent =
    landPoints.toFixed(2);
resetTimer();
loadNextQuestion();
}

function removeTwoAnswers() {
const answers = document.querySelectorAll(".answer");
let removed = 0;
answers.forEach((answer, index) => {
    if (index !== currentGameQuestion.correct && removed < 2) {
    answer.style.display = "none";
    removed++;
    }
});
}

function changeQuestion() {
resetTimer();
loadNextQuestion();
}

function callFriend() {
// alert("صديقك يقترح الإجابة رقم " + (currentGameQuestion.correct + 1));
showPopup("صديقك يقترح الإجابة رقم " + (currentGameQuestion.correct + 1));
}

function useGuide() {
    const guideLink = currentGameQuestion.guideLink;
    const sessionData = currentGameQuestion.sessionvars;
    
    // Save the current game state before clearing session storage
    const savedGameState = sessionStorage.getItem('gameState');
    
    // Clear only the guide-related session data
    sessionStorage.clear();
    
    // Restore the game state
    if (savedGameState) {
        sessionStorage.setItem('gameState', savedGameState);
    }

    // Set the guide session variables
    if (sessionData) {
        for (let key in sessionData) {
            if (sessionData.hasOwnProperty(key)) {
                sessionStorage.setItem(key, sessionData[key]);
            }
        }
    }

    // Open the guide link in a new window
    if (guideLink) {
        window.open(guideLink, "_blank");
    } else {
        showPopup("لا يوجد دليل لهذا السؤال.");
    }
}

function saveGameState() {
    const gameState = {
        currentGameQuestion,
        currentRound,
        roundScore,
        correctAnswers,
        timeLeft,
        landPoints,
        questionState: {} // Save the state of questions for each list
    };
    
    // Save the state of remaining questions for each list
    for (const listName in questions) {
        gameState.questionState[listName] = [...questions[listName]];
    }
    
    sessionStorage.setItem('gameState', JSON.stringify(gameState));
}

function loadGameState() {
    const savedState = sessionStorage.getItem('gameState');
    if (savedState) {
        const gameState = JSON.parse(savedState);
        currentGameQuestion = gameState.currentGameQuestion;
        currentRound = gameState.currentRound;
        roundScore = gameState.roundScore;
        correctAnswers = gameState.correctAnswers;
        timeLeft = gameState.timeLeft;
        landPoints = gameState.landPoints;
        
        // Restore the questions state
        if (gameState.questionState) {
            for (const listName in gameState.questionState) {
                questions[listName] = gameState.questionState[listName];
            }
        }
        
        // Update UI
        document.getElementById("correct-answers").textContent = correctAnswers;
        document.getElementById("land-points").textContent = landPoints.toFixed(2);
        
        // Load the current question UI
        if (currentGameQuestion.question) {
            document.getElementById("question").textContent = currentGameQuestion.question;
            document.getElementById("question-number").textContent = `السؤال ${correctAnswers + 1}`;
            
            const answers = document.querySelectorAll(".answer");
            answers.forEach((answer, index) => {
                answer.style.display = "block";
                answer.textContent = currentGameQuestion.answers[index];
                answer.onclick = () => checkAnswer(answer, index === currentGameQuestion.correct);
            });
            
            startTimer();
            updateScoreboard();
        }
    } else {
        resetGame();
    }
}

// Add event listener to load game state when page loads
window.addEventListener('load', () => {
    const savedState = sessionStorage.getItem('gameState');
    if (savedState) {
        loadGameState();
    } else {
        loadNextQuestion();
    }
});