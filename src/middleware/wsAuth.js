const jwt = require("jsonwebtoken")

const JWT_SECRET = process.env.JWT_SECRET

function wsAuth(request) {
  const url = new URL(request.url, "http://localhost")
  const token = url.searchParams.get("token")

  if (!token) {
    return { error: "Unauthorized: token required" }
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return { user: decoded }
  } catch {
    return { error: "Unauthorized: invalid or expired token" }
  }
}

module.exports = wsAuth
