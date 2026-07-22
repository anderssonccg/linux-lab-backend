const Docker = require("dockerode")

const CONTAINER_NAME = process.env.CONTAINER_NAME || "linux-lab"
const docker = new Docker()

async function execInteractive(opts = {}) {
  const container = docker.getContainer(CONTAINER_NAME)

  const exec = await container.exec({
    Cmd: opts.cmd || ["bash"],
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    Tty: true,
    Env: opts.env || [],
  })

  const stream = await exec.start({ Tty: true, hijack: true })
  return stream
}

async function execSimple(command) {
  const container = docker.getContainer(CONTAINER_NAME)

  const exec = await container.exec({
    Cmd: ["/bin/bash", "-c", command],
    AttachStdout: true,
    AttachStderr: true,
  })

  const stream = await exec.start()
  let output = ""

  return new Promise((resolve, reject) => {
    stream.on("data", (data) => { output += data.toString() })
    stream.on("end", () => resolve(output.trim()))
    stream.on("error", reject)
  })
}

module.exports = { execInteractive, execSimple }
