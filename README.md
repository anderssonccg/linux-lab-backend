# linux-lab-backend

Backend API con Express y Prisma ORM (PostgreSQL).

## Requisitos

- Node.js >= 18
- PostgreSQL (o base de datos remota como Neon)

## Variables de entorno

Crear un archivo `.env` en la raíz:

```env
PORT=3000
DATABASE_URL="postgresql://usuario:password@host:5432/linux_lab"
```

## Instalación

```bash
npm install
npx prisma generate
```

## Desarrollo

```bash
npm run dev
```

## Prisma

- `npx prisma migrate dev --name <nombre>` — Crear migración tras agregar modelos
- `npx prisma db push` — Sincronizar schema sin migración
- `npx prisma studio` — UI para ver datos

## Estructura

```
├── prisma/
│   ├── schema.prisma    # Modelos de datos
│   └── client.js        # Singleton de PrismaClient
├── src/
│   └── index.js         # Servidor Express
├── .env                 # Variables de entorno
└── package.json
```
