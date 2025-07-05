const WebSocket = require("ws");
const server = new WebSocket.Server({ port: 8080 });

let scores = {};
let kills = {};
let gameTimer = null;
const GAME_DURATION = 60 * 1000; // 60 seconds

function startGameTimer() {
  if (gameTimer) return; // already running

  console.log("⏱️ Game timer started");

  gameTimer = setTimeout(() => {
    broadcastGameOver();
    gameTimer = null;
    scores = {};
    kills = {};
  }, GAME_DURATION);
}

server.on("connection", socket => {
  console.log("🐾 New player connected");

  let playerId = "player_" + Math.floor(Math.random() * 10000);
  socket.send(JSON.stringify({
    type: "init",
    playerId,
    message: "Welcome to Tiger Hunt!"
  }));

  startGameTimer();

  socket.on("message", msg => {
    try {
      const data = JSON.parse(msg);

      switch (data.type) {
        case "score":
          scores[data.playerId] = (scores[data.playerId] || 0) + data.points;
          kills[data.playerId] = (kills[data.playerId] || 0) + 1;
          broadcastLeaderboard();
          break;

        case "chat":
          broadcastChat(data.playerId, data.message);
          break;

        default:
          console.warn("⚠️ Unknown message type:", data.type);
      }
    } catch (err) {
      console.error("❌ Failed to parse message:", err);
    }
  });

  socket.on("close", () => {
    delete scores[playerId];
    delete kills[playerId];
    broadcastLeaderboard();
  });
});

function broadcastLeaderboard() {
  const message = JSON.stringify({
    type: "leaderboard",
    scores,
    kills
  });
  broadcastToAll(message);
}

function broadcastChat(player, message) {
  const packet = JSON.stringify({
    type: "chat",
    playerId: player,
    message
  });
  broadcastToAll(packet);
}

function broadcastGameOver() {
  const message = JSON.stringify({
    type: "gameOver",
    scores,
    kills,
    message: "🏁 Game Over! Final results sent."
  });
  broadcastToAll(message);
}

function broadcastToAll(payload) {
  server.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}