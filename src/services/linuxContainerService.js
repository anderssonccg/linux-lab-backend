const containerClient = require("./containerClient")

class ContainerServiceError extends Error {
  constructor(message, code) {
    super(message)
    this.name = "ContainerServiceError"
    this.code = code
  }
}

async function createUser(username) {
  const command = `id -u ${username} >/dev/null 2>&1 && exit 0 || useradd -m -s /bin/bash ${username}`
  const output = await containerClient.execSimple(command)
  return { username, output: output || "" }
}

async function userExists(username) {
  const command = `id -u ${username} >/dev/null 2>&1 && echo "exists" || echo "missing"`
  const output = await containerClient.execSimple(command)
  return output === "exists"
}

async function openPtySession(username, extraEnv = []) {
  const env = [`USER=${username}`, `HOME=/home/${username}`, `TERM=xterm-256color`, ...extraEnv]
  return containerClient.execInteractive({ user: username, env })
}

function closePtySession(stream) {
  if (stream && typeof stream.destroy === "function") {
    stream.destroy()
  }
}

module.exports = {
  createUser,
  userExists,
  openPtySession,
  closePtySession,
  ContainerServiceError,
}
