const WebSocket = require("ws");
const server = new WebSocket.Server({ port: 8080 });

let scores = {};

server.on("connection", socket => {
  console.log("🐾 New player connected");

  socket.send(JSON.stringify({
    type: "init",
    message: "Welcome to Tiger Tap!"
  }));

  socket.on("message", msg => {
    try {
      const data = JSON.parse(msg);

      switch (data.type) {
        case "score":
          scores[data.playerId] = (scores[data.playerId] || 0) + data.points;
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
});

function broadcastLeaderboard() {
  const message = JSON.stringify({ type: "leaderboard", scores });
  broadcastToAll(message);
}

function broadcastChat(player, message) {
  const packet = JSON.stringify({ type: "chat", playerId: player, message });
  broadcastToAll(packet);
}

function broadcastToAll(payload) {
  server.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}