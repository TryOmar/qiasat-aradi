// Curated Arabic Titles for Game Categories
const categoryMap = {
  generalMeasurementInfo: "معلومات القياس العامة",
  exampleQuestions: "مسائل تقسيم الأراضي",
  areaCalculator: "حساب مساحات الأشكال",
  dimensionChecker: "التحقق من الأبعاد",
  boundarySeparation: "فصل الحدود (سهل)",
  mediumBoundarySeparation: "فصل الحدود (متوسط)",
  hardBoundarySeparation: "فصل الحدود (صعب)",
  removalAndSubtraction: "طرح الأراضي (سهل)",
  hardRemovalAndSubtraction: "طرح الأراضي (صعب)",
  inheritanceDivision: "تقسيم المواريث والشركاء",
  landValueCalculation: "حساب قيم الأراضي والأسعار",
  convertQasabToMeter: "تحويل القصبات إلى أمتار",
  convertMeterToQasab: "تحويل الأمتار إلى قصبات",
  convertKiratToMeter: "تحويل القراريط إلى أمتار",
  convertMeterToKirat: "تحويل الأمتار إلى قراريط"
};

// Backup original questions database list to reload during game reset
const questionsBackup = (typeof questions !== "undefined") ? JSON.parse(JSON.stringify(questions)) : null;

// Global Variables
let currentGameQuestion = {};
let currentRound = 0;
let roundScore = 0;
let correctAnswers = 0;
let timerInterval = null;
let timeLeft = 120;
let maxTime = 120;
let landPoints = 0;

let lifelines = {
  removeTwo: true,
  changeQuestion: true,
  callFriend: true,
  useGuide: true
};

// --- Synthesizer Sound Engine (Native Web Audio API) ---
let soundMuted = localStorage.getItem("gameSoundMuted") === "true";
let audioCtx = null;

function initAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playTone(freq, type, duration, volume = 0.1) {
  if (soundMuted) return;
  try {
    initAudioContext();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.error("Audio error:", e);
  }
}

function playCorrectSound() {
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  notes.forEach((freq, index) => {
    setTimeout(() => {
      playTone(freq, "triangle", 0.6, 0.15);
      playTone(freq * 2, "sine", 0.3, 0.05);
    }, index * 100);
  });
}

function playWrongSound() {
  if (soundMuted) return;
  try {
    initAudioContext();
    const duration = 0.8;
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc1.type = "sawtooth";
    osc2.type = "sawtooth";
    
    osc1.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc2.frequency.setValueAtTime(153, audioCtx.currentTime);
    
    osc1.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + duration);
    osc2.frequency.exponentialRampToValueAtTime(81, audioCtx.currentTime + duration);
    
    gainNode.gain.setValueAtTime(0.18, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc1.start();
    osc2.start();
    
    osc1.stop(audioCtx.currentTime + duration);
    osc2.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.error("Audio error:", e);
  }
}

function playLifelineSound() {
  if (soundMuted) return;
  try {
    initAudioContext();
    const duration = 0.5;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + duration);
    
    gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.error("Audio error:", e);
  }
}

function playPhoneRingSound() {
  if (soundMuted) return;
  try {
    initAudioContext();
    const duration = 1.8;
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc1.type = "sine";
    osc2.type = "sine";
    
    osc1.frequency.setValueAtTime(853, audioCtx.currentTime);
    osc2.frequency.setValueAtTime(960, audioCtx.currentTime);
    
    const modulator = audioCtx.createOscillator();
    const modGain = audioCtx.createGain();
    
    modulator.frequency.value = 15;
    modGain.gain.value = 40;
    
    modulator.connect(osc1.frequency);
    modulator.connect(osc2.frequency);
    
    gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.0, audioCtx.currentTime + 0.5);
    gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime + 0.7);
    gainNode.gain.setValueAtTime(0.0, audioCtx.currentTime + 1.2);
    gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime + 1.4);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    modulator.start();
    osc1.start();
    osc2.start();
    
    modulator.stop(audioCtx.currentTime + duration);
    osc1.stop(audioCtx.currentTime + duration);
    osc2.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.error("Audio error:", e);
  }
}

function playStartFanfare() {
  const notes = [
    { freq: 261.63, delay: 0 },   // C4
    { freq: 329.63, delay: 0.15 }, // E4
    { freq: 392.00, delay: 0.3 },  // G4
    { freq: 523.25, delay: 0.45 }, // C5
    { freq: 659.25, delay: 0.6 }   // E5
  ];
  notes.forEach((note) => {
    setTimeout(() => {
      playTone(note.freq, "triangle", 0.7, 0.1);
    }, note.delay * 1000);
  });
}

function playTickSound() {
  playTone(timeLeft <= 20 ? 900 : 550, "sine", 0.04, 0.04);
}

function playVictoryFanfare() {
  const chords = [
    { freqs: [261.63, 329.63, 392.00, 523.25], duration: 0.4, delay: 0 },
    { freqs: [293.66, 349.23, 440.00, 587.33], duration: 0.4, delay: 0.4 },
    { freqs: [329.63, 415.30, 493.88, 659.25], duration: 1.2, delay: 0.8 }
  ];
  chords.forEach((chord) => {
    setTimeout(() => {
      chord.freqs.forEach((f) => {
        playTone(f, "triangle", chord.duration, 0.08);
      });
    }, chord.delay * 1000);
  });
}

function toggleMute() {
  soundMuted = !soundMuted;
  localStorage.setItem("gameSoundMuted", soundMuted);
  updateMuteButtonUI();
  
  if (!soundMuted) {
    initAudioContext();
    playTone(440, "sine", 0.15, 0.1);
  }
}

function updateMuteButtonUI() {
  const btn = document.getElementById("sound-toggle-btn");
  if (btn) {
    btn.textContent = soundMuted ? "🔇" : "🔊";
  }
}

// Automatically sync the mute button icon on load
window.addEventListener("load", updateMuteButtonUI);

// Custom Premium Modal Popup Helper
function showCustomPopup(title, text, btnText = "موافق", callback = null) {
  // Remove existing overlays just in case
  const oldOverlay = document.querySelector(".dark-popup-overlay");
  if (oldOverlay) document.body.removeChild(oldOverlay);

  const overlay = document.createElement("div");
  overlay.className = "dark-popup-overlay";

  const popup = document.createElement("div");
  popup.className = "dark-popup";

  const closeBtn = document.createElement("button");
  closeBtn.className = "dark-popup-close";
  closeBtn.innerHTML = "×";
  closeBtn.onclick = () => closePopup();

  const titleEl = document.createElement("h3");
  titleEl.style.color = "#ff9f1c";
  titleEl.style.marginBottom = "15px";
  titleEl.style.fontSize = "1.3em";
  titleEl.textContent = title;

  const content = document.createElement("div");
  content.className = "dark-popup-content";
  content.innerHTML = text;

  const actionBtn = document.createElement("button");
  actionBtn.className = "dark-popup-btn";
  actionBtn.textContent = btnText;
  actionBtn.onclick = () => {
    closePopup();
    if (callback) callback();
  };

  popup.appendChild(closeBtn);
  popup.appendChild(titleEl);
  popup.appendChild(content);
  popup.appendChild(actionBtn);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.classList.add("active");
    popup.classList.add("active");
  });

  function closePopup() {
    overlay.classList.remove("active");
    popup.classList.remove("active");
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }, 300);
  }

  // Close on ESC
  const escHandler = (e) => {
    if (e.key === "Escape") {
      closePopup();
      document.removeEventListener("keydown", escHandler);
    }
  };
  document.addEventListener("keydown", escHandler);
}

// Start Game from the main screen
function startGame() {
  document.getElementById("start-screen").classList.remove("active");
  document.getElementById("game-screen").classList.add("active");

  const savedState = sessionStorage.getItem("gameState");
  if (savedState) {
    loadGameState();
  } else {
    playStartFanfare();
    resetGameData();
    loadNextQuestion();
  }
}

// Render the 15-step side ladder dynamically
function renderLadder() {
  const ladderContainer = document.getElementById("sidebar-ladder");
  if (!ladderContainer) return;
  ladderContainer.innerHTML = "";

  // gameQuestions has 15 entries. Let's list from index 14 down to 0
  const steps = [...gameQuestions].reverse();
  const originalIndices = [...Array(15).keys()].reverse();

  // Let's compute cumulative points for each step to display on ladder
  let cumulative = 0;
  const cumulativeScores = gameQuestions.map((q) => {
    cumulative += q.score;
    return cumulative;
  });

  steps.forEach((step, reverseIdx) => {
    const originalIdx = originalIndices[reverseIdx];
    const isMilestone = (originalIdx + 1) === 5 || (originalIdx + 1) === 10 || (originalIdx + 1) === 15;
    const isCurrent = originalIdx === correctAnswers;
    const isCompleted = originalIdx < correctAnswers;

    const stepDiv = document.createElement("div");
    stepDiv.className = "ladder-step";
    if (isMilestone) stepDiv.classList.add("milestone");
    if (isCurrent) stepDiv.classList.add("active");
    if (isCompleted) stepDiv.classList.add("completed");

    let statusSymbol = "♦";
    if (isCompleted) statusSymbol = "✓";
    if (isCurrent) statusSymbol = "▶";

    stepDiv.innerHTML = `
      <span class="step-num">${originalIdx + 1} ${statusSymbol}</span>
      <span class="step-points">${cumulativeScores[originalIdx]} فدان</span>
    `;

    ladderContainer.appendChild(stepDiv);
  });
}

// Get random question and pull it from list to avoid duplication
function getRandomQuestionAndRemove(listName) {
  if (questions[listName] && questions[listName].length > 0) {
    const randomIndex = Math.floor(Math.random() * questions[listName].length);
    const randomQuestion = questions[listName].splice(randomIndex, 1)[0];
    return randomQuestion;
  }
  return null;
}

// Shuffle option answers
function shuffleAnswers(answers, correctIndex) {
  const indexedAnswers = answers.map((answer, index) => ({
    answer,
    isCorrect: index === correctIndex
  }));

  for (let i = indexedAnswers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexedAnswers[i], indexedAnswers[j]] = [indexedAnswers[j], indexedAnswers[i]];
  }

  const newCorrectIndex = indexedAnswers.findIndex((item) => item.isCorrect);

  return {
    shuffledAnswers: indexedAnswers.map((item) => item.answer),
    newCorrectIndex
  };
}

// Load Next question in sequence
function loadNextQuestion() {
  if (correctAnswers === 15) {
    playVictoryFanfare();
    showCustomPopup(
      "👑 فوز ساحق!",
      "تهانينا الحارة! لقد أجبت على جميع الأسئلة الـ 15 بشكل صحيح وحصلت على الجائزة الكبرى: <strong>100 فدان زراعي</strong> ومكانة الدلال الأكبر!",
      "العب من جديد",
      () => { resetGameData(); resetGame(); }
    );
    return;
  }

  let q = null;
  while (currentRound < gameQuestions.length && !q) {
    const currentGame = gameQuestions[currentRound];
    const listName = currentGame.list;
    roundScore = currentGame.score;

    q = getRandomQuestionAndRemove(listName);

    if (!q) {
      currentRound++;
    }
  }

  if (q) {
    currentGameQuestion = q;

    // Shuffle answers
    const { shuffledAnswers, newCorrectIndex } = shuffleAnswers(q.answers, q.correct);
    q.answers = shuffledAnswers;
    q.correct = newCorrectIndex;

    // Reset Timer
    resetTimer();

    // Set UI Category / Question Title
    const categoryName = categoryMap[gameQuestions[currentRound].list] || "معلومات قياس الأراضي";
    document.getElementById("level-category").textContent = categoryName;

    document.getElementById("question").textContent = q.question;
    document.getElementById("question-number").textContent = `${correctAnswers + 1} / 15`;
    document.getElementById("land-points").textContent = `${landPoints} فدان`;
    document.getElementById("guaranteed-points").textContent = `${calculateGuaranteedPoints()} فدان`;

    // Populate answers
    const answersButtons = document.querySelectorAll(".answer-btn");
    const answersWrappers = document.querySelectorAll(".answer-wrapper");

    answersWrappers.forEach((wrapper, index) => {
      wrapper.style.display = "block";
      wrapper.className = "hexagon-wrapper answer-wrapper"; // clear custom state classes
      
      const btn = document.getElementById(`ans-${index}`);
      btn.textContent = q.answers[index];
      
      wrapper.onclick = () => selectOption(wrapper, index === q.correct, index);
    });

    renderLadder();
    startTimer();
    saveGameState();
  } else {
    showCustomPopup("انتهاء الأسئلة", "لقد نفدت الأسئلة في هذا القسم! سيتم تحويلك إلى الجولة التالية تلقائياً.", "التالي", () => {
      currentRound++;
      loadNextQuestion();
    });
  }
}

// Timer Controls
function startTimer(resume = false) {
  if (!resume) {
    timeLeft = maxTime;
  }
  updateTimerUI();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerUI();
    playTickSound();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      showCustomPopup(
        "⏰ انتهى الوقت!",
        `نفد الوقت المسموح للتفكير في السؤال! الجائزة المضمونة التي حصلت عليها هي: <strong>${calculateGuaranteedPoints()} فدان</strong>.`,
        "حاول مرة أخرى",
        () => { resetGameData(); resetGame(); }
      );
    }
  }, 1000);
}

function resetTimer() {
  if (timerInterval) clearInterval(timerInterval);
}

function updateTimerUI() {
  document.getElementById("timer").textContent = timeLeft;
  const bar = document.getElementById("timer-bar");
  if (bar) {
    const percentage = (timeLeft / maxTime) * 100;
    bar.style.width = `${percentage}%`;
    
    // Change colors based on remaining time
    if (percentage > 50) {
      bar.style.background = "linear-gradient(90deg, #2ec4b6, #00f5d4)";
    } else if (percentage > 20) {
      bar.style.background = "linear-gradient(90deg, #ff9f1c, #ffbf69)";
    } else {
      bar.style.background = "linear-gradient(90deg, #e63946, #ff4d6d)";
    }
  }
}

// Option selection check with Millionaire-like delay for excitement
function selectOption(selectedWrapper, isCorrect, index) {
  // Prevent double clicks
  const wrappers = document.querySelectorAll(".answer-wrapper");
  wrappers.forEach((w) => (w.onclick = null));

  resetTimer();
  playTone(440, "sine", 0.08, 0.08);
  selectedWrapper.classList.add("selected");

  // Millionaire dramatic delay (1 second)
  setTimeout(() => {
    selectedWrapper.classList.remove("selected");
    
    if (isCorrect) {
      playCorrectSound();
      selectedWrapper.classList.add("correct");
      correctAnswers++;
      landPoints += roundScore;
      
      document.getElementById("land-points").textContent = `${landPoints} فدان`;
      
      // Save state
      saveGameState();

      setTimeout(() => {
        currentRound++;
        loadNextQuestion();
      }, 1500);
    } else {
      playWrongSound();
      selectedWrapper.classList.add("incorrect");
      
      // Reveal correct answer
      const correctIdx = currentGameQuestion.correct;
      const correctWrapper = document.getElementById(`ans-wrapper-${correctIdx}`);
      if (correctWrapper) correctWrapper.classList.add("correct");

      setTimeout(() => {
        const guaranteed = calculateGuaranteedPoints();
        showCustomPopup(
          "😢 إجابة خاطئة!",
          `لقد اخترت إجابة غير صحيحة. رصيدك المضمون طبقاً لمحطات الأمان هو: <strong>${guaranteed} فدان</strong>.`,
          "حاول مجدداً",
          () => { resetGameData(); resetGame(); }
        );
      }, 1800);
    }
  }, 1000);
}

// Calculate Safe Points (Milestones)
function calculateGuaranteedPoints() {
  // Milestone 1 (Level 5): Cumulative points = 25 Feddans
  // Milestone 2 (Level 10): Cumulative points = 50 Feddans
  if (correctAnswers >= 10) {
    return 50;
  } else if (correctAnswers >= 5) {
    return 25;
  }
  return 0;
}

// Game Reset Trigger
function resetGameData() {
  sessionStorage.removeItem("gameState");
  correctAnswers = 0;
  landPoints = 0;
  currentRound = 0;
  timeLeft = maxTime;

  lifelines = {
    removeTwo: true,
    changeQuestion: true,
    callFriend: true,
    useGuide: true
  };

  // Re-read initial questions list from script file backup (refreshing arrays)
  if (window.questionsBackup) {
    questions = JSON.parse(JSON.stringify(window.questionsBackup));
  }
}

function resetGame() {
  resetTimer();
  resetGameData();
  
  // Update UI Elements
  document.getElementById("correct-answers-count")?.remove(); // clean up if any
  document.getElementById("land-points").textContent = "0 فدان";
  document.getElementById("guaranteed-points").textContent = "0 فدان";
  document.getElementById("question-number").textContent = "1 / 15";

  // Re-enable lifeline buttons visually
  updateLifelineButtonsUI();
  loadNextQuestion();
}

function confirmReset() {
  showCustomPopup(
    "تأكيد إعادة اللعب",
    "هل أنت متأكد من رغبتك في إعادة تشغيل اللعبة؟ ستخسر كل التقدم الحالي ورصيد الفدادين الذي جمعته.",
    "نعم، أعد اللعب",
    () => { resetGameData(); resetGame(); }
  );
}

// --- Lifelines Logic ---

// 1. Remove 2 Incorrect Answers (50:50)
function useLifelineRemove() {
  if (!lifelines.removeTwo) return;

  playLifelineSound();
  const correctIndex = currentGameQuestion.correct;
  let removed = 0;

  // Collect wrong answer indices
  const wrongIndices = [];
  for (let i = 0; i < 4; i++) {
    if (i !== correctIndex) wrongIndices.push(i);
  }

  // Shuffle wrong indices and take 2
  for (let i = wrongIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [wrongIndices[i], wrongIndices[j]] = [wrongIndices[j], wrongIndices[i]];
  }

  // Hide 2 of them
  const answersWrappers = document.querySelectorAll(".answer-wrapper");
  wrongIndices.slice(0, 2).forEach((idx) => {
    answersWrappers[idx].style.display = "none";
  });

  lifelines.removeTwo = false;
  updateLifelineButtonsUI();
  saveGameState();
}

// 2. Change Question
function useLifelineChange() {
  if (!lifelines.changeQuestion) return;

  resetTimer();
  playLifelineSound();
  lifelines.changeQuestion = false;
  updateLifelineButtonsUI();

  // Reload another random question for the same list category without updating currentRound
  const currentGame = gameQuestions[currentRound];
  const listName = currentGame.list;
  const q = getRandomQuestionAndRemove(listName);

  if (q) {
    currentGameQuestion = q;
    
    // Shuffle answers
    const { shuffledAnswers, newCorrectIndex } = shuffleAnswers(q.answers, q.correct);
    q.answers = shuffledAnswers;
    q.correct = newCorrectIndex;

    document.getElementById("question").textContent = q.question;

    const answersWrappers = document.querySelectorAll(".answer-wrapper");
    answersWrappers.forEach((wrapper, index) => {
      wrapper.style.display = "block";
      wrapper.className = "hexagon-wrapper answer-wrapper";
      
      const btn = document.getElementById(`ans-${index}`);
      btn.textContent = q.answers[index];
      
      wrapper.onclick = () => selectOption(wrapper, index === q.correct, index);
    });

    startTimer();
    saveGameState();
  } else {
    showCustomPopup("خطأ", "لا توجد أسئلة بديلة متوفرة في هذا القسم.", "موافق");
    lifelines.changeQuestion = true; // restore lifeline if failed
    updateLifelineButtonsUI();
    startTimer();
  }
}

// 3. Phone a Friend (Interactive dialogue simulation)
function useLifelineFriend() {
  if (!lifelines.callFriend) return;

  playPhoneRingSound();

  // Show a calling screen simulator
  showCustomPopup(
    "📞 جاري الاتصال بالصديق...",
    `<div style='display:flex; flex-direction:column; align-items:center; gap:12px; margin: 15px 0;'>
      <div style='width: 50px; height: 50px; border: 3px solid #ff9f1c; border-top-color: transparent; border-radius: 50%; animation: rotateRing 1s linear infinite;'></div>
      <p>يرجى الانتظار، جاري التواصل مع الخبير الزراعي...</p>
     </div>`,
    "انتظر الرد...",
    null
  );

  // Auto-answer after 2 seconds with friend dialog
  setTimeout(() => {
    const correctAnsText = currentGameQuestion.answers[currentGameQuestion.correct];
    
    // Custom friendly speech
    const dialogues = [
      `أهلاً بك يا صديقي! بخصوص هذا السؤال، أنا واثق جداً من أن الإجابة الصحيحة هي: <strong style='color:#00f5d4; font-size:1.15em;'>"${correctAnsText}"</strong>. بالتوفيق!`,
      `السلام عليكم! لقد راجعت دليل الدلال مؤخراً، وأكاد أجزم بنسبة 90% أن الإجابة الصحيحة هي: <strong style='color:#00f5d4; font-size:1.15em;'>"${correctAnsText}"</strong>.`,
      `مرحباً! أعتقد أن الإجابة المنطقية بناء على الحسابات هي: <strong style='color:#00f5d4; font-size:1.15em;'>"${correctAnsText}"</strong>. توكل على الله واخترها!`
    ];
    
    const randomSpeech = dialogues[Math.floor(Math.random() * dialogues.length)];

    showCustomPopup(
      "🎙️ المكالمة الهاتفية مع الصديق",
      `<p style='text-align:right;'><strong>الصديق (الخبير):</strong> "${randomSpeech}"</p>`,
      "شكراً لك يا صديقي",
      null
    );
  }, 2000);
}

// 4. Use the Guide (Ask the guide / open calculator with variables preset)
function useLifelineGuide() {
  if (!lifelines.useGuide) return;

  playLifelineSound();
  const guideLink = currentGameQuestion.guideLink;
  const sessionData = currentGameQuestion.sessionvars;

  if (guideLink) {
    // Preserve game state
    const savedGameState = sessionStorage.getItem("gameState");
    sessionStorage.clear();
    if (savedGameState) sessionStorage.setItem("gameState", savedGameState);

    // Seed session data for calculator
    if (sessionData) {
      for (let key in sessionData) {
        if (sessionData.hasOwnProperty(key)) {
          sessionStorage.setItem(key, sessionData[key]);
        }
      }
    }

    showCustomPopup(
      "👳‍♂️ الدلال يقودك للحل!",
      "سيقوم الدلال الآن بفتح الحاسبة المجهزة بالبيانات الافتراضية لهذا السؤال في نافذة جديدة. جرب الحساب والتقسيم بنفسك لمعرفة الحل بدقة!",
      "افتح حاسبة الأراضي",
      () => {
        window.open(guideLink, "_blank");
      }
    );
  } else {
    showCustomPopup("👳‍♂️ الدلال يعتذر", "لا يوجد رابط دليل حاسوبي مخصص لهذا السؤال المحدد، يمكنك التفكير بالحل بنفسك.", "موافق");
  }
}

// Update lifeline buttons view based on availability
function updateLifelineButtonsUI() {
  document.getElementById("lifeline-remove").disabled = !lifelines.removeTwo;
  document.getElementById("lifeline-change").disabled = !lifelines.changeQuestion;
  document.getElementById("lifeline-friend").disabled = !lifelines.callFriend;
  document.getElementById("lifeline-guide").disabled = !lifelines.useGuide;
}

// State Persistence Saving / Loading
function saveGameState() {
  const gameState = {
    currentGameQuestion,
    currentRound,
    roundScore,
    correctAnswers,
    timeLeft,
    landPoints,
    lifelines,
    questionState: {}
  };

  for (const listName in questions) {
    gameState.questionState[listName] = [...questions[listName]];
  }

  sessionStorage.setItem("gameState", JSON.stringify(gameState));
}

function loadGameState() {
  const savedState = sessionStorage.getItem("gameState");
  if (savedState) {
    const gameState = JSON.parse(savedState);
    currentGameQuestion = gameState.currentGameQuestion;
    currentRound = gameState.currentRound;
    roundScore = gameState.roundScore;
    correctAnswers = gameState.correctAnswers;
    timeLeft = gameState.timeLeft;
    landPoints = gameState.landPoints;
    lifelines = gameState.lifelines;

    // Restore remaining questions pool
    if (gameState.questionState) {
      for (const listName in gameState.questionState) {
        questions[listName] = gameState.questionState[listName];
      }
    }

    updateLifelineButtonsUI();

    // Render active question
    if (currentGameQuestion && currentGameQuestion.question) {
      const q = currentGameQuestion;
      
      const categoryName = categoryMap[gameQuestions[currentRound].list] || "معلومات قياس الأراضي";
      document.getElementById("level-category").textContent = categoryName;

      document.getElementById("question").textContent = q.question;
      document.getElementById("question-number").textContent = `${correctAnswers + 1} / 15`;
      document.getElementById("land-points").textContent = `${landPoints} فدان`;
      document.getElementById("guaranteed-points").textContent = `${calculateGuaranteedPoints()} فدان`;

      const answersWrappers = document.querySelectorAll(".answer-wrapper");
      answersWrappers.forEach((wrapper, index) => {
        wrapper.style.display = "block";
        wrapper.className = "hexagon-wrapper answer-wrapper";
        
        const btn = document.getElementById(`ans-${index}`);
        btn.textContent = q.answers[index];
        
        wrapper.onclick = () => selectOption(wrapper, index === q.correct, index);
      });

      renderLadder();
      startTimer(true);
    } else {
      resetGameData();
      loadNextQuestion();
    }
  } else {
    resetGame();
  }
}

// Automatically load game state on page load if active
window.addEventListener("load", () => {
  const savedState = sessionStorage.getItem("gameState");
  if (savedState) {
    document.getElementById("start-screen").classList.remove("active");
    document.getElementById("game-screen").classList.add("active");
    loadGameState();
  }
});