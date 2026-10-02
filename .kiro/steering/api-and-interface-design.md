---
inclusion: always
---

# Skill: API and Interface Design

Design stable, well-documented interfaces that are hard to misuse.

## Core Principles

### Contract First

Define the interface before implementing it. The contract is the spec — implementation follows.

### Consistent Error Semantics

Pick one error strategy and use it everywhere:

```typescript
interface APIError {
  error: {
    code: string; // Machine-readable: "VALIDATION_ERROR"
    message: string; // Human-readable
    details?: unknown;
  };
}
// 400 → invalid data, 401 → not auth, 403 → not authorized
// 404 → not found, 422 → validation failed, 500 → server error
```

### Validate at Boundaries

- Validate at API route handlers (user input)
- Validate at external service responses (treat as untrusted)
- Do NOT validate between internal functions with shared type contracts

### Prefer Addition Over Modification

Add optional fields rather than changing/removing existing ones. Breaking changes break consumers.

## REST Patterns

```
GET    /api/tasks          → List (with query params for filtering)
POST   /api/tasks          → Create
GET    /api/tasks/:id      → Get single
PATCH  /api/tasks/:id      → Update (partial)
DELETE /api/tasks/:id      → Delete
```

Always paginate list endpoints:

```
GET /api/tasks?page=1&pageSize=20&sortBy=createdAt&sortOrder=desc
```

## TypeScript Interface Patterns

- Use discriminated unions for variants
- Separate Input types from Output types (Input = what caller provides, Output = includes server-generated fields)
- Use branded types for IDs to prevent mixing `TaskId` with `UserId`

## Hyrum's Law

Every observable behavior — including undocumented quirks, error message text, timing, ordering — becomes a de facto contract once users depend on it. Be intentional about what you expose.

## Red Flags

- Endpoints that return different shapes depending on conditions
- Inconsistent error formats across endpoints
- List endpoints without pagination
- Verbs in REST URLs (`/api/createTask`, `/api/getUsers`)
- Third-party API responses used without validation
- Breaking changes to existing fields

## Verification Checklist

- [ ] Every endpoint has typed input and output schemas
- [ ] Error responses follow a single consistent format
- [ ] Validation happens at system boundaries only
- [ ] List endpoints support pagination
- [ ] New fields are additive and optional
- [ ] Naming follows consistent conventions
