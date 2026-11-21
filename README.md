# kursova

## Система складського обліку

**Опис:**
Створити систему для обліку товарів на складі.

**Основні функції системи:**

- Реєстрація товарів (назва, артикул, кількість, ціна, постачальник).
- Облік руху товарів (надходження, відвантаження, списання).
- Контроль залишків на складі.
- Автоматичне сповіщення про мінімальний запас.
- Можливість формування накладних і актів.
- Облік постачальників і контрагентів.

**Звіти:**

- Стан складу на певну дату.
- Динаміка руху товарів.
- Фінансова оцінка товарних залишків.

UML-діаграми: [діаграма варіантів використання](docs/diagrams/use-case.svg) ([джерело](docs/diagrams/use-case.puml)), [діаграма класів](docs/diagrams/class-diagram.svg) ([джерело](docs/diagrams/class-diagram.puml)).

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

Demo accounts (demo-only, created by automatic seeding):

| Username | Password | Role |
| --- | --- | --- |
| `admin` | `admin-demo-123` | admin |
| `operator` | `operator-demo-123` | operator |

Operators can view products and parties. Admins can also create, edit and archive products, suppliers and counterparties. In Swagger UI, log in with `POST /api/auth/login`, press Authorize and paste the access token.

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

Backend integration tests run against a temporary PostgreSQL database and do not touch stored data:

```bash
docker compose --profile test run --rm --build backend-test
```

To save the live OpenAPI document to a file (the backend must be running): `npm run openapi:export` in `backend/` after `npm run build`.

## Design patterns

The class diagram shows all participants: [class-diagram.svg](docs/diagrams/class-diagram.svg).

### Command: stock movements

Each kind of movement is a command with an `execute` method. `ReceiveGoodsCommand`, `ShipGoodsCommand` and `WriteOffGoodsCommand` check the rules of their own document type (supplier, counterparty or reason), write the ledger lines and update product quantity and inventory value. `MovementService` is the invoker: it locks the products in ID order, chooses the command and runs it inside one database transaction, so a failed line rolls back the whole document. This fits the application because the three movements share one flow but differ in their rules. After changing stock, each command notifies the Observer.

- [stock-command.js](backend/src/inventory/commands/stock-command.js) (contract)
- [receive-goods.command.js](backend/src/inventory/commands/receive-goods.command.js)
- [ship-goods.command.js](backend/src/inventory/commands/ship-goods.command.js)
- [write-off-goods.command.js](backend/src/inventory/commands/write-off-goods.command.js)
- [ledger.js](backend/src/inventory/commands/ledger.js) (shared weighted-average calculation and ledger writes)
- [movement.service.js](backend/src/inventory/movement.service.js) (invoker)

### Observer: low-stock notifications

`StockChangeSubject` keeps a list of observers. `LowStockObserver` is subscribed when the inventory module starts. The subject awaits every observer inside the same transaction, so an observer error cancels the whole operation. The observer keeps at most one active notification per product: it creates, updates or resolves it. Commands call the subject after stock changes, and `ProductService` calls it after a product is created, edited, archived or restored, so threshold edits use the same logic.

- [stock-change.subject.js](backend/src/inventory/stock-change.subject.js)
- [stock-observer.js](backend/src/inventory/stock-observer.js) (contract)
- [low-stock.observer.js](backend/src/inventory/low-stock.observer.js)
- [product.service.js](backend/src/products/product.service.js) (extra notifier)

### Strategy: reports

Each report is a strategy with a `generate` method and its own query and result structure: `InventoryAsOfStrategy` (quantity, unit cost and value on a date), `MovementDynamicsStrategy` (daily received, shipped and written-off quantities) and `InventoryValuationStrategy` (value by product and a grand total). `ReportService` is the context: it chooses a strategy from a short fixed list and delegates to it. This fits the application because the reports share the ledger but calculate different results, and a new report needs only a new class. All reports read the ledger deltas that the Command pattern writes, so history and valuation stay consistent.

- [report-strategy.js](backend/src/reports/report-strategy.js) (contract)
- [inventory-as-of.strategy.js](backend/src/reports/inventory-as-of.strategy.js)
- [movement-dynamics.strategy.js](backend/src/reports/movement-dynamics.strategy.js)
- [inventory-valuation.strategy.js](backend/src/reports/inventory-valuation.strategy.js)
- [ledger-balances.js](backend/src/reports/ledger-balances.js) (shared ledger sums)
- [report.service.js](backend/src/reports/report.service.js) (context)
