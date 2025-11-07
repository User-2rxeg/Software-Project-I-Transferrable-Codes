# Chat Module

Provides real-time and RESTful chat functionality including room creation, direct messages, message history, pagination, and read receipts.

## Responsibilities
- Create group or direct chat conversations
- List user's chat rooms
- Send messages (optional attachment URL)
- Retrieve history with cursor/limit style pagination
- Mark messages as read up to a point
- Auto or manual creation of Direct Messages (DM) between two users

## Authentication & Authorization
All endpoints require JWT (`JwtAuthGuard`) and pass through `RolesGuard` (if role-based constraints are later added). Base route prefix: `/chat`.

## Primary Endpoints
| Method | Path | Description | Body / Query |
|--------|------|-------------|--------------|
| POST | `/chat/rooms` | Create a chat room | `CreateChatDto` |
| GET | `/chat/rooms` | List my chat rooms | `page, limit` |
| GET | `/chat/:chatId/history` | Get message history | `before, limit` + `chatId` param |
| POST | `/chat/:chatId/messages` | Send a message to room | `SendMessageDto` without `chatId` (passed in path) |
| POST | `/chat/:chatId/read` | Mark messages as read | `MarkReadDto` without `chatId` |
| POST | `/chat/dm/:otherUserId` | Get or create direct message conversation | `otherUserId` param |

## DTOs
Defined in `Communication/Chat/Validator/Chat-Validator.ts`:
- `CreateChatDto`
- `SendMessageDto`
- `HistoryQueryDto`
- `MarkReadDto`

## Pagination Strategy
History endpoint supports `before` cursor to fetch messages before a specific message id with a `limit` size.

## Read Receipts
`markRead` marks messages up to a given ID as read for the current user.

## Extending
- Add delivery receipts or typing indicators through WebSocket gateway.
- Integrate with `NotificationGateway` to push real-time alerts for new messages.

## Error Handling
Service methods should throw NestJS HTTP exceptions for unauthorized access, invalid chat IDs, or permission issues.

## Related Modules
- `Authentication` for user identity extraction (`CurrentUser` decorator).
- `Notification` for real-time push events.

