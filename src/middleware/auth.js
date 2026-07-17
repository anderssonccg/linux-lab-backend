const jwt = require("jsonwebtoken")

const JWT_SECRET = process.env.JWT_SECRET

function authMiddleware(req, res, next) {
  const token = req.cookies?.token

  if (!token) {
    return res.status(401).json({ error: "No autorizado: sesión no encontrada" })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ error: "No autorizado: sesión inválida o expirada" })
  }
}

module.exports = authMiddleware
