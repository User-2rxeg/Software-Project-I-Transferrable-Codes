# Admin Module

The Admin module provides privileged operations for managing users, broadcasting announcements, exporting user data, and viewing security / metrics dashboards.

## Key Responsibilities
- Create, update, and delete users
- Change user roles
- Export users to CSV
- Broadcast announcements to all users or a specific role
- View system metrics and security overview

## Authentication & Authorization
All endpoints are protected by JWT and the `RolesGuard`. Only users with role `Admin` (from `UserRole.ADMIN`) can access these routes.
Base route prefix: `/admin`.

## Endpoints
| Method | Path | Description | Body / Query |
|--------|------|-------------|--------------|
| POST | `/admin/create-user` | Create a user as admin | `CreateUserDto` + optional `?adminId=` query |
| PATCH | `/admin/:id` | Update user by id | `UpdateUserDto` |
| DELETE | `/admin/:id` | Hard delete user | — |
| GET | `/admin/users` | List users (filters) | `q, role, verified, page, limit` |
| PATCH | `/admin/users/:id/role` | Update user's role | `{ role }` (`UpdateUserRoleBodyDto`) |
| GET | `/admin/users/export` | Export users as CSV (file download) | — |
| GET | `/admin/metrics` | Basic metrics summary | — |
| GET | `/admin/security` | Security overview | `limit, from, to` |
| POST | `/admin/announce/all` | Announcement to all users | `AnnounceAllDto` |
| POST | `/admin/announce/role` | Announcement to one role | `AnnounceRoleDto` |

## Data Transfer Objects (DTO)
Located under `Admin/Validator/Admin-Validator.ts` and `User/Validator/User-Validator.ts`.

## Metrics & Security Overview
The security endpoint aggregates recent audit/security data (rate limited by `limit`, optional date filtering `from` / `to`).

## Announcements
Announcements are queued via `AdminService.announceAll` or `AdminService.announceRole` to deliver messages to user notification pipeline.

## CSV Export
Generates a temporary CSV file; controller streams it using Express `res.download`. Ensure filesystem permissions.

## Extending
- Add new administrative actions by adding methods to `AdminService` and corresponding controller routes.
- Integrate audit logging by injecting `AuditLogService` and recording events.

## Error Handling
Standard NestJS exceptions are thrown from underlying services. Controller returns JSON error payload with appropriate HTTP status.

## Related Modules
- `UserModule` for user persistence and business logic.
- `Authentication` for guards and role enforcement.
- `Audit-Log` for recording admin actions (if integrated).

## Setup Notes
Ensure environment variables provide database connection and JWT secrets so guard + services function properly.

