const { Role } = require("@prisma/client")
const prisma = require("../../prisma/client")

class ServiceError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const TEACHER_SELECT = {
  id: true,
  name: true,
  email: true,
  active: true,
}

async function findAll(filters = {}) {
  const where = { role: Role.teacher }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  if (filters.status === "active") where.active = true
  if (filters.status === "inactive") where.active = false

  return prisma.user.findMany({
    where,
    select: TEACHER_SELECT,
    orderBy: { created_at: "desc" },
  })
}

async function register({ name, email }) {
  if (!name?.trim()) {
    throw new ServiceError("El nombre del docente es requerido", 400)
  }
  if (!email?.trim()) {
    throw new ServiceError("El correo electrónico es requerido", 400)
  }

  const normalizedEmail = email.toLowerCase().trim()

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new ServiceError("El formato del correo electrónico no es válido", 400)
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (existing) {
    throw new ServiceError("El correo electrónico ya está registrado en la plataforma", 409)
  }

  return prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      role: Role.teacher,
      active: true,
    },
    select: TEACHER_SELECT,
  })
}

async function toggleActive(id) {
  const user = await prisma.user.findUnique({ where: { id } })

  if (!user || user.role !== Role.teacher) {
    throw new ServiceError("Docente no encontrado", 404)
  }

  return prisma.user.update({
    where: { id },
    data: { active: !user.active },
    select: TEACHER_SELECT,
  })
}

module.exports = { findAll, register, toggleActive, ServiceError }
