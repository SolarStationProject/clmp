# CleanMap 🗺️
### Sistema de Gestión de Microbasurales
**Universidad Andrés Bello - Ingeniería de Software II - 2026**

---

## 📋 Requisitos previos
Antes de comenzar, asegúrate de tener instaladas estas versiones exactas:

| Herramienta | Versión | Descarga |
|-------------|---------|----------|
| Node.js | v22.17.1 | https://nodejs.org |
| npm | 10.2.3 | Viene con Node.js |
| Git | 2.41.0 | https://git-scm.com |
| PostgreSQL | 16.x | https://www.postgresql.org |

Para verificar tus versiones ejecuta:
```bash
node -v
npm -v
git --version
```

---

## 🚀 Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/cleanmap.git
cd cleanmap
```

### 2. Instalar todas las dependencias
```bash
npm run setup
```
Este comando instala automáticamente las dependencias de los 3 proyectos (frontend-web, frontend-mobile y backend).

### 3. Configurar variables de entorno
```bash
cd backend
cp .env.example .env
```
Edita el archivo `.env` con tus credenciales locales de PostgreSQL.

---

## 🏃 Ejecutar el proyecto

Abre 3 terminales distintas:

**Terminal 1 - Panel Web Admin:**
```bash
npm run dev:web
```

**Terminal 2 - App Móvil:**
```bash
npm run dev:mobile
```

**Terminal 3 - Backend:**
```bash
npm run dev:backend
```

---

## 🌿 Flujo de trabajo con Git

### Nunca trabajes directo en `main`. Siempre crea tu rama:

```bash
# 1. Actualizar main
git pull origin main

# 2. Crear tu rama
git checkout -b feature/nombre-de-tu-funcionalidad

# 3. Trabajar en tu código...

# 4. Guardar cambios
git add .
git commit -m "feat: descripción de lo que hiciste"

# 5. Subir tu rama
git push origin feature/HU001-registro-usuario

# 6. Abrir Pull Request en GitHub para revisión
```

### Convención de nombres para ramas:
- `feature/` → nueva funcionalidad
- `fix/` → corrección de bug
- `docs/` → documentación

---

## 🗂️ Estructura del proyecto

```
cleanmap/
├── frontend-web/        # Panel Admin (React + TypeScript + Tailwind + Leaflet)
├── frontend-mobile/     # App Ciudadanos (React + TypeScript + Tailwind + Capacitor + Leaflet)
├── backend/             # API REST (Node.js + Express + TypeScript + pg)
├── database/
│   ├── migrations/      # Creación de tablas
│   └── seeds/           # Datos iniciales de prueba
├── .nvmrc               # Versión de Node.js
├── .gitignore
└── README.md
```

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend Web | React 18 + TypeScript + Tailwind CSS + Leaflet |
| Frontend Mobile | React 18 + TypeScript + Tailwind CSS + Capacitor + Leaflet |
| Backend | Node.js + Express + TypeScript |
| Base de Datos | PostgreSQL 16 + PostGIS |
| Autenticación | JWT + Bcrypt |
| Documentación API | Swagger |
| ORM/Driver BD | pg (node-postgres) |

---


---

## 📅 Planificación

| Sprint | Fechas | Entregables |
|--------|--------|-------------|
| Sprint 0 | 02/03 - 13/03 | Documentación, Setup, BD |
| Sprint 1 | 16/03 - 27/03 | Autenticación, APIs básicas |
| Sprint 2 | 30/03 - 10/04 | Reportes, GPS, Fotos |
| Sprint 3 | 13/04 - 24/04 | Mapa interactivo, Filtros |
| Sprint 4 | 27/04 - 08/05 | Panel Admin, Dashboard básico |
| Sprint 5 | 11/05 - 22/05 | Notificaciones, Dashboard avanzado |
| Sprint 6 | 25/05 - 05/06 | Testing completo, Deploy producción |
| Buffer | 08/06 - 19/06 | Refinamiento, Ajustes finales |
