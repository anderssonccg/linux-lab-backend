const { WebSocketServer } = require("ws")
const wsAuth = require("./middleware/wsAuth")
const containerClient = require("./services/containerClient")

function setupGateway(server) {
  const wss = new WebSocketServer({ server, path: "/terminal" })

  wss.on("connection", async (ws, request) => {
    const auth = wsAuth(request)
    if (auth.error) {
      ws.close(4001, auth.error)
      return
    }

    let stream
    try {
      stream = await containerClient.execInteractive({
        env: [`USER=${auth.user.id}`, `HOME=/home/${auth.user.id}`, `TERM=xterm-256color`],
      })
    } catch (err) {
      ws.close(4001, `Container error: ${err.message}`)
      return
    }

    stream.on("data", (data) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: "output", data: data.toString() }))
      }
    })

    stream.on("end", () => {
      ws.send(JSON.stringify({ type: "exit", code: 0 }))
      ws.close()
    })

    stream.on("error", () => {
      ws.close(4001, "Stream error")
    })

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString())
        if (msg.type === "input") stream.write(msg.data)
      } catch {
        // skip invalid messages
      }
    })

    ws.on("close", () => {
      if (stream) stream.destroy()
    })
  })
}

module.exports = setupGateway
