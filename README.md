# kursova

Курсова робота: веб-застосунок складського обліку `kursova`.

**Завдання.** Розробити невеликий веб-застосунок для обліку товарів на складі з REST API, базою даних PostgreSQL та веб-інтерфейсом. Застосунок має підтримувати:

- реєстрацію товарів: назва, унікальний SKU, кількість, ціна, постачальник і мінімальний залишок;
- оприбутковування, відвантаження та списання товарів;
- поточні залишки та автоматичні сповіщення про низький залишок;
- друковані документи: прибуткова накладна, видаткова накладна та акт списання;
- облік постачальників і контрагентів;
- три звіти: залишки на обрану дату, динаміка руху товарів і вартісна оцінка залишків.

Також потрібні аналіз предметної області, діаграма варіантів використання ([Use Case](docs/diagrams/use-case.svg)), діаграма класів UML ([Class diagram](docs/diagrams/class-diagram.svg)), мінімум три шаблони проєктування GoF і прозора історія Git. Є проста адміністративна частина з двома ролями: `admin` та `operator`.

Джерела діаграм (PlantUML): [use-case.puml](docs/diagrams/use-case.puml), [class-diagram.puml](docs/diagrams/class-diagram.puml).

## Technology

- Backend: Node.js, NestJS (JavaScript, compiled with Babel), TypeORM with `EntitySchema` definitions and explicit migrations.
- Database: PostgreSQL.
- API: REST with JSON, documented with Swagger UI and OpenAPI 3.
- Frontend: React, Vite and plain CSS, served by Nginx.
- Runtime: Docker Compose with PostgreSQL, backend and frontend services.

## Run locally

Prerequisite: Docker Desktop (with WSL on Windows). Node.js and PostgreSQL are not needed on the host.

Start everything from the repository root:

```bash
docker compose up --build -d
```

Migrations and seeding run automatically before the backend starts.

| Service | URL |
| --- | --- |
| Application | http://localhost:8080 |
| API health | http://localhost:3000/api/health |
| Swagger UI | http://localhost:3000/api/docs |
| OpenAPI JSON | http://localhost:3000/api/openapi.json |

If a default host port is busy, copy `.env.example` to `.env` and change `FRONTEND_PORT` or `BACKEND_PORT`.

Demo accounts are not available yet: login is added together with the access module.

Logs:

```bash
docker compose logs -f
```

Stop (data is kept in the named Docker volume):

```bash
docker compose down
```

Optional reset. This permanently deletes all stored data:

```bash
docker compose down -v
```

To save the live OpenAPI document to a file (the backend must be running): `npm run openapi:export` in `backend/` after `npm run build`.
