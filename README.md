# DealerOS AI

DealerOS AI is a dealership command center being piloted at Reliable Auto Sales.

## Current milestone

The inventory module is backed by Prisma and supports:

- Live inventory listing, search, status filtering, and age filtering
- Add, view, and edit vehicle records
- Status changes and non-destructive archiving
- VIN, year, mileage, status, price, and cost validation
- Decimal-safe pricing and calculated days-in-stock, total cost, and gross
- Dashboard alerts calculated from active inventory

## Local setup

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm run lint
npm run build
```

SQLite is currently used for local development. A managed PostgreSQL database and dealership authentication are planned before production use.
