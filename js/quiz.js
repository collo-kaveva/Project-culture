/**
 * quiz.js — "Test your Kenya knowledge" quiz mode.
 * Generates multiple-choice questions about counties (capitals, population, etc.)
 */

import { shuffle, randomItem, escapeHtml, formatNumber } from './utils.js';
import { getQuizBestScore, setQuizBestScore } from './storage.js';
import { showToast } from './ui.js';

let allCounties = [];
let questions = [];
let currentIndex = 0;
let score = 0;
const TOTAL_QUESTIONS = 10;

export function initQuiz(counties) {
  allCounties = counties;
  const startBtn = document.getElementById('quiz-start-btn');
  startBtn?.addEventListener('click', startQuiz);
}

function generateQuestions() {
  const types = ['capital', 'population', 'governor'];
  const pool = shuffle(allCounties).slice(0, TOTAL_QUESTIONS);

  return pool.map(county => {
    const type = randomItem(types);
    return buildQuestion(county, type);
  });
}

function buildQuestion(county, type) {
  const distractors = shuffle(allCounties.filter(c => c.id !== county.id)).slice(0, 3);

  if (type === 'capital') {
    const options = shuffle([county.capital, ...distractors.map(d => d.capital)]);
    return {
      question: `What is the capital of ${county.name} County?`,
      options,
      answer: county.capital
    };
  }

  if (type === 'governor') {
    const options = shuffle([county.governor, ...distractors.map(d => d.governor)]);
    return {
      question: `Who is the governor of ${county.name} County?`,
      options,
      answer: county.governor
    };
  }

  // population — ask which county has the given capital
  const options = shuffle([county.name, ...distractors.map(d => d.name)]);
  return {
    question: `Which county has ${county.capital} as its capital?`,
    options,
    answer: county.name
  };
}

function startQuiz() {
  questions = generateQuestions();
  currentIndex = 0;
  score = 0;
  renderQuestion();
}

function renderQuestion() {
  const container = document.getElementById('quiz-container');
  if (!container || currentIndex >= questions.length) {
    return endQuiz();
  }

  const q = questions[currentIndex];
  const progressPct = ((currentIndex) / questions.length) * 100;

  container.innerHTML = `
    <div class="quiz-progress">
      <span style="font-size:var(--text-sm); color:var(--clr-text-muted); white-space:nowrap;">
        ${currentIndex + 1} / ${questions.length}
      </span>
      <div class="quiz-progress__bar">
        <div class="quiz-progress__fill" style="width:${progressPct}%"></div>
      </div>
      <span style="font-size:var(--text-sm); color:var(--clr-primary); font-weight:600; white-space:nowrap;">
        ${score} pts
      </span>
    </div>
    <div class="quiz-question">${escapeHtml(q.question)}</div>
    <div class="quiz-options">
      ${q.options.map(opt => `
        <button class="quiz-option" data-answer="${escapeHtml(opt)}">${escapeHtml(opt)}</button>
      `).join('')}
    </div>
  `;

  container.querySelectorAll('.quiz-option').forEach(btn => {
    btn.addEventListener('click', () => handleAnswer(btn, q));
  });
}

function handleAnswer(btn, question) {
  const allOptions = document.querySelectorAll('.quiz-option');
  allOptions.forEach(b => b.disabled = true);

  const isCorrect = btn.dataset.answer === question.answer;
  if (isCorrect) {
    btn.classList.add('is-correct');
    score += 10;
  } else {
    btn.classList.add('is-wrong');
    allOptions.forEach(b => {
      if (b.dataset.answer === question.answer) b.classList.add('is-correct');
    });
  }

  setTimeout(() => {
    currentIndex++;
    renderQuestion();
  }, 1200);
}

function endQuiz() {
  const container = document.getElementById('quiz-container');
  if (!container) return;

  const isNewRecord = setQuizBestScore(score);
  const best = getQuizBestScore();
  const pct = Math.round((score / (TOTAL_QUESTIONS * 10)) * 100);

  let message = 'Keep exploring Kenya to learn more!';
  if (pct >= 90) message = 'Outstanding! You truly know Kenya.';
  else if (pct >= 70) message = 'Great job! You know your counties well.';
  else if (pct >= 50) message = 'Good effort! A bit more exploring will help.';

  container.innerHTML = `
    <div style="text-align:center;">
      <div style="font-size:3rem; margin-bottom:var(--space-4);">${pct >= 70 ? '🏆' : '🎓'}</div>
      <h3 class="quiz-question">You scored ${score} / ${TOTAL_QUESTIONS * 10}</h3>
      <p style="color:var(--clr-text-secondary); margin-bottom:var(--space-2);">${message}</p>
      <p style="color:var(--clr-text-muted); font-size:var(--text-sm); margin-bottom:var(--space-8);">
        Best score: ${best} pts ${isNewRecord ? '🎉 New record!' : ''}
      </p>
      <button class="btn btn--primary" id="quiz-restart-btn">Play Again</button>
    </div>
  `;

  document.getElementById('quiz-restart-btn')?.addEventListener('click', startQuiz);

  if (isNewRecord) showToast('New high score! 🎉');
}
