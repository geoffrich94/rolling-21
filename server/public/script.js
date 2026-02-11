const socket = new WebSocket("wss://YOUR-BACKEND-URL");
let myPlayerIndex = null;

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "init") {
    myPlayerIndex = data.player;
    document.getElementById(`you--${myPlayerIndex}`).classList.remove("hidden");
  }

  if (data.type === "update") {
    updateUI(data);
  }
};

// UI elements
const pl0ScoreEl = document.getElementById("score--0");
const pl1ScoreEl = document.getElementById("score--1");
const diceEl = document.getElementById("die");
const btnRoll = document.querySelector(".btn--roll");
const btnStand = document.querySelector(".btn--stand");
const player0El = document.querySelector(".player--0");
const player1El = document.querySelector(".player--1");
const round0El = document.getElementById("round--0");
const round1El = document.getElementById("round--1");
const pl0NameEl = document.getElementById("name--0");
const pl1NameEl = document.getElementById("name--1");
const startButton = document.querySelector(".startscreen .btn");
const startscreenEl = document.querySelector(".startscreen");
const mainEl = document.querySelector(".main");

// Start game
startButton.addEventListener("click", () => {
  startscreenEl.classList.add("hidden");
  mainEl.classList.remove("hidden");
});

// Roll & Stand buttons
btnRoll.addEventListener("click", () => socket.send(JSON.stringify({ type: "roll" })));
btnStand.addEventListener("click", () => socket.send(JSON.stringify({ type: "stand" })));

function updateUI(data) {
  pl0ScoreEl.innerHTML = data.scores[0];
  pl1ScoreEl.innerHTML = data.scores[1];
  round0El.innerHTML = data.roundScore[0];
  round1El.innerHTML = data.roundScore[1];

  // Active player highlight
  if (data.currentPlayer === 0) {
    player0El.classList.add("player--active");
    player1El.classList.remove("player--active");
  } else {
    player1El.classList.add("player--active");
    player0El.classList.remove("player--active");
  }

  // Dice display
  if (data.lastDice) {
    for (let i = 1; i <= 6; i++) diceEl.classList.remove("show-" + i);
    diceEl.classList.add("show-" + data.lastDice);
  }

  // Enable/disable buttons
  btnRoll.disabled = myPlayerIndex !== data.currentPlayer || data.winner !== null;
  btnStand.disabled = myPlayerIndex !== data.currentPlayer || data.winner !== null;

  // Handle winner
  if (data.winner !== null) {
    if (data.winner === 0) {
      player0El.classList.add("player--winner");
      player0El.querySelector(".player__name").textContent = "Player 1 WINS!";
      player1El.classList.remove("player--winner");
      pl1NameEl.textContent = "Player 2";
    } else {
      player1El.classList.add("player--winner");
      player1El.querySelector(".player__name").textContent = "Player 2 WINS!";
      player0El.classList.remove("player--winner");
      pl0NameEl.textContent = "Player 1";
    }
  } else {
    // Reset names if no winner
    pl0NameEl.textContent = "Player 1";
    pl1NameEl.textContent = "Player 2";
    player0El.classList.remove("player--winner");
    player1El.classList.remove("player--winner");
  }
}
