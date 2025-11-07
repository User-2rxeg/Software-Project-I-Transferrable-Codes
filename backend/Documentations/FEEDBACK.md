# Feedback Module

Collects and manages user feedback with CRUD endpoints and an admin listing API.

## Responsibilities
- Submit feedback (authenticated users)
- List current user's feedback (or global list if no user filter applied)
- Retrieve, update, and delete a feedback entry
- Admin-only listing with query filters

## Authentication & Authorization
Most endpoints require JWT (`JwtAuthGuard`). The admin listing also requires `RolesGuard` with `UserRole.ADMIN`.
Base route prefix: `/feedback`.

## Endpoints
| Method | Path | Description | Notes |
|--------|------|-------------|-------|
| POST | `/feedback` | Submit feedback | Body: `{ title, description, category?, priority? }` |
| GET | `/feedback` | List feedback | Query: `page, limit` |
| GET | `/feedback/:id` | Get feedback by id | — |
| PATCH | `/feedback/:id` | Update feedback | Body: any subset of `{ title, description, category, priority }` |
| DELETE | `/feedback/:id` | Delete feedback | — |
| GET | `/feedback/admin/all` | Admin list all feedback | Query: `q, category, page, limit` and `Admin` role required |

## DTOs
- Request DTOs in `Communication/Feedback/Validator/Feedback-Validator.ts`
- Public response shape in `Communication/Feedback/Validator/public-feedback.dto.ts`

## Extending
- Add status field (open, investigating, resolved) and workflows
- Integrate audit logging for moderation actions
- Add notifications on status changes via Notification gateway

## Error Handling
Standard NestJS errors from service for validation, not found, and permission issues.

