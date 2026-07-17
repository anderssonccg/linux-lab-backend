const express = require("express")
const jwt = require("jsonwebtoken")
const { getAuth } = require("firebase-admin/auth")
const firebaseApp = require("../config/firebase")
const prisma = require("../../prisma/client")
const authMiddleware = require("../middleware/auth")

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
}

router.post("/firebase", async (req, res) => {
  try {
    const { idToken } = req.body
    if (!idToken) {
      return res.status(400).json({ error: "Token requerido" })
    }

    if (!firebaseApp) {
      return res.status(500).json({ error: "Firebase no está configurado en el servidor" })
    }

    const auth = getAuth(firebaseApp)
    const decoded = await auth.verifyIdToken(idToken)
    const { email, name, uid, picture } = decoded

    if (!email) {
      return res.status(400).json({ error: "El correo es requerido" })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return res.status(401).json({ error: "Usuario no registrado en la plataforma" })
    }

    if (!user.active) {
      return res.status(403).json({ error: "Cuenta desactivada. Contacta al administrador." })
    }

    if (!user.google_id) {
      await prisma.user.update({
        where: { id: user.id },
        data: { google_id: uid },
      })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" },
    )

    res.cookie("token", token, COOKIE_OPTIONS)

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        googleId: uid,
        active: user.active,
      },
    })
  } catch (error) {
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({ error: "Sesión de Google expirada" })
    }
    if (error.code === "auth/argument-error") {
      return res.status(400).json({ error: "Token inválido" })
    }
    console.error("Firebase auth error:", error?.message || error)
    res.status(500).json({ error: error?.message || "Error de autenticación" })
  }
})

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!user) {
      res.clearCookie("token", { path: "/" })
      return res.status(401).json({ error: "Usuario no encontrado" })
    }
    if (!user.active) {
      res.clearCookie("token", { path: "/" })
      return res.status(403).json({ error: "Cuenta desactivada" })
    }
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        googleId: user.google_id,
        active: user.active,
      },
    })
  } catch (error) {
    console.error("Auth me error:", error)
    res.status(500).json({ error: "Error al obtener sesión" })
  }
})

router.post("/logout", authMiddleware, (_req, res) => {
  res.clearCookie("token", { path: "/" })
  res.json({ message: "Sesión cerrada" })
})

module.exports = router
