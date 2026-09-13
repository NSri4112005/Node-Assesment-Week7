# Inventory & Stock Management System - Main Branch

A backend inventory and stock management system built using Node.js, TypeScript, MongoDB, and Mongoose.

## Features

* Pure Node.js HTTP server
* TypeScript with strict type checking
* MongoDB with Mongoose
* JWT authentication
* Role-based authorization
* Admin and staff roles
* Product CRUD
* Unique SKU validation
* Inventory management
* Add stock
* Remove stock
* Stock adjustment
* Stock movement history
* Low-stock detection
* Product search
* Category filtering
* Stock filtering
* Price and stock sorting
* Pagination with metadata
* Inventory reports
* CSV inventory export using Node.js streams
* In-memory rate limiting
* Input validation
* Error handling
* CORS support
* Jest tests
* Atomic stock removal for concurrency protection

## Technologies

* Node.js
* TypeScript
* MongoDB
* Mongoose
* JWT
* bcryptjs
* Jest
* ts-jest

## Architecture

```text
src/
├── config/
│   └── database.ts
├── controllers/
│   ├── auth.controller.ts
│   ├── product.controller.ts
│   ├── inventory.controller.ts
│   └── report.controller.ts
├── middleware/
│   ├── auth.middleware.ts
│   ├── role.middleware.ts
│   └── rate-limit.middleware.ts
├── models/
│   ├── user.model.ts
│   ├── product.model.ts
│   ├── inventory.model.ts
│   └── stock-movement.model.ts
├── routes/
│   ├── auth.routes.ts
│   ├── product.routes.ts
│   ├── inventory.routes.ts
│   └── report.routes.ts
├── services/
│   ├── auth.service.ts
│   ├── product.service.ts
│   ├── inventory.service.ts
│   └── report.service.ts
├── types/
│   ├── auth.types.ts
│   ├── product.types.ts
│   ├── inventory.types.ts
│   └── api.types.ts
├── utils/
│   ├── jwt.ts
│   └── csv.ts
├── router.ts
└── server.ts

tests/
├── auth.test.ts
├── product.test.ts
├── inventory.test.ts
├── reports.test.ts
├── concurrency.test.ts
└── basic.test.ts
```

## Requirements

* Node.js 18+
* MongoDB
* npm

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/inventory_management
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=1d
```

Never commit `.env` to Git.

## Run the Application

Development:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Production:

```bash
npm start
```

Server:

```text
http://localhost:3000
```

## Authentication

### Register

```http
POST /api/auth/register
Content-Type: application/json
```

Request:

```json
{
  "name": "Staff User",
  "email": "staff@example.com",
  "password": "password123"
}
```

New registrations are created as `staff`.

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

Request:

```json
{
  "email": "staff@example.com",
  "password": "password123"
}
```

The response contains a JWT token.

Use the token for protected APIs:

```text
Authorization: Bearer YOUR_TOKEN
```

### Current User

```http
GET /api/auth/me
Authorization: Bearer YOUR_TOKEN
```

## Products

### Create Product

Admin only:

```http
POST /api/products
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json
```

Request:

```json
{
  "name": "Laptop",
  "sku": "LAP001",
  "description": "Development laptop",
  "price": 60000,
  "category": "Electronics",
  "reorderLevel": 5
}
```

### Get Products

```http
GET /api/products
Authorization: Bearer TOKEN
```

Supported query parameters:

```text
search=Laptop
category=Electronics
stock=low
stock=out
sort=price_asc
sort=price_desc
sort=stock_asc
page=1
limit=10
```

Example:

```http
GET /api/products?category=Electronics&sort=price_asc&page=1&limit=10
```

Response contains pagination metadata.

### Get Product

```http
GET /api/products/:productId
Authorization: Bearer TOKEN
```

### Update Product

Admin only:

```http
PUT /api/products/:productId
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json
```

### Delete Product

Admin only:

```http
DELETE /api/products/:productId
Authorization: Bearer ADMIN_TOKEN
```

## Inventory

### Get All Inventory

```http
GET /api/inventory
Authorization: Bearer TOKEN
```

### Get Inventory by Product

```http
GET /api/inventory/:productId
Authorization: Bearer TOKEN
```

### Add Stock

Admin and staff:

```http
POST /api/inventory/:productId/add
Authorization: Bearer TOKEN
Content-Type: application/json
```

Request:

```json
{
  "quantity": 10,
  "reason": "New stock received"
}
```

### Remove Stock

Admin and staff:

```http
POST /api/inventory/:productId/remove
Authorization: Bearer TOKEN
Content-Type: application/json
```

Request:

```json
{
  "quantity": 3,
  "reason": "Product sold"
}
```

The stock update uses a conditional database update so stock cannot become negative during concurrent removal requests.

### Adjust Stock

Admin only:

```http
PATCH /api/inventory/:productId/adjust
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json
```

Request:

```json
{
  "quantity": 20,
  "reason": "Physical stock count correction"
}
```

### Low Stock

```http
GET /api/inventory/low-stock
Authorization: Bearer TOKEN
```

Low stock is identified when:

```text
quantity <= reorderLevel
```

### Stock History

```http
GET /api/inventory/:productId/history
Authorization: Bearer TOKEN
```

Every stock change records:

* Product
* Movement type
* Quantity
* Previous stock
* New stock
* Reason
* User
* Timestamp

## Reports

Admin only:

```http
GET /api/reports/inventory
Authorization: Bearer ADMIN_TOKEN
```

Report includes:

* Total products
* Total stock
* Total inventory value
* Low-stock count
* Out-of-stock count
* Stock-in summary
* Stock-out summary
* Adjustment summary
* Total movements

## CSV Export

Admin only:

```http
GET /api/reports/inventory/export
Authorization: Bearer ADMIN_TOKEN
```

The inventory report is exported as CSV.

The implementation uses a Node.js readable stream and processes inventory records incrementally instead of loading the complete dataset into memory.

## Rate Limiting

In-memory rate limiting is implemented for sensitive operations.

| Endpoint     |              Limit |
| ------------ | -----------------: |
| Login        |  5 requests/minute |
| Add stock    | 30 requests/minute |
| Remove stock | 30 requests/minute |

When the limit is exceeded, the server returns:

```http
429 Too Many Requests
```

The response also includes a `Retry-After` header.

The current implementation is in-memory and is suitable for a single server instance. A distributed production deployment would use a shared store such as Redis.

## Validation and Error Handling

The API handles:

* Missing required fields
* Invalid JSON
* Invalid ObjectId
* Invalid quantity
* Negative values
* Invalid price
* Duplicate SKU
* Duplicate email
* Product not found
* Inventory not found
* Insufficient stock
* Unauthorized requests
* Forbidden role access
* Unknown routes
* Database errors

## Concurrency

Stock removal uses an atomic conditional MongoDB update:

```text
productId + quantity >= requestedQuantity
```

and then decreases the stock atomically.

This prevents concurrent removal requests from reducing inventory below zero.

## Testing

Run all tests:

```bash
npm test -- --runInBand
```

Current test coverage includes:

* Authentication validation
* Product validation
* Inventory validation
* Insufficient stock rules
* Low-stock rules
* Inventory report calculations
* Concurrency stock rules
* Basic application tests

Current test result:

```text
Test Suites: 6 passed, 6 total
Tests: 17 passed, 17 total
```

## Git Workflow

The project uses feature branches and pull requests.

Example:

```bash
git checkout -b feature/inventory-management
git add .
git commit -m "feat: add inventory management"
git push origin feature/inventory-management
```

## Limitations

* Rate limiting is stored in application memory.
* CSV export performs product lookup while streaming inventory records.
* Local MongoDB transaction support depends on MongoDB deployment configuration.
* Authentication tokens should be stored securely by clients.
* `.env` must never be committed.

## Project Status

The project implements authentication, product management, inventory management, stock movements, reports, CSV export, rate limiting, validation, concurrency protection, and automated tests.
