const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve frontend (optional for testing locally)
app.use(express.static(path.join(__dirname, "../public")));

const game = {
  players: [],
  currentPlayer: 0,
  scores: [0, 0],
  roundScore: [0, 0],
  lastDice: null,
};

wss.on("connection", (ws) => {
  console.log("New client connected");

  if (game.players.length >= 2) {
    ws.send(JSON.stringify({ type: "full" }));
    ws.close();
    return;
  }

  const playerIndex = game.players.length;
  game.players.push(ws);
  ws.playerIndex = playerIndex;

  ws.send(JSON.stringify({ type: "init", player: playerIndex }));

  broadcastState();

  ws.on("message", (message) => {
    const data = JSON.parse(message);
    handleMessage(ws, data);
  });

  ws.on("close", () => {
    console.log("Player disconnected");
    game.players = [];
    resetGame();
  });
});

function handleMessage(ws, data) {
  if (data.type === "roll") handleRoll(ws.playerIndex);
  if (data.type === "stand") handleStand(ws.playerIndex);
}

function handleRoll(playerIndex) {
  if (playerIndex !== game.currentPlayer) return;

  const dice = Math.floor(Math.random() * 6) + 1;
  game.lastDice = dice;
  game.scores[playerIndex] += dice;

  if (game.scores[playerIndex] > 21) {
    const otherPlayer = 1 - playerIndex;
    game.roundScore[otherPlayer]++;
    resetRound();
    broadcastState();
    return;
  }

  broadcastState();
}

function handleStand(playerIndex) {
  if (playerIndex !== game.currentPlayer) return;

  game.currentPlayer = 1 - game.currentPlayer;

  if (playerIndex === 1) {
    if (game.scores[0] > game.scores[1]) game.roundScore[0]++;
    else if (game.scores[1] > game.scores[0]) game.roundScore[1]++;
    resetRound();
  }

  broadcastState();
}

function resetRound() {
  game.scores = [0, 0];
  game.currentPlayer = 0;
  game.lastDice = null;
}

function broadcastState() {
  // Check if someone reached 3 rounds
  const winnerIndex = game.roundScore.findIndex((score) => score >= 3);
  const state = {
    type: "update",
    scores: game.scores,
    roundScore: game.roundScore,
    currentPlayer: game.currentPlayer,
    lastDice: game.lastDice,
    winner: winnerIndex !== -1 ? winnerIndex : null,
  };

  game.players.forEach((player) => {
    player.send(JSON.stringify(state));
  });

  if (winnerIndex !== -1) {
    // After 3 seconds, reset the entire game
    setTimeout(() => {
      game.roundScore = [0, 0];
      resetRound();
      broadcastState();
    }, 10000);
  }
}

function resetGame() {
  game.currentPlayer = 0;
  game.scores = [0, 0];
  game.roundScore = [0, 0];
  game.lastDice = null;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
