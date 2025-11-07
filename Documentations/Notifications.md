# Notification Module

Provides a Socket.IO-based gateway for delivering real-time notifications to authenticated users.

## Responsibilities
- Authenticate WebSocket clients using JWT
- Maintain per-user rooms and emit targeted events
- Offer a simple API to emit to a user from server-side code

## Gateway
`NotificationGateway` (`/Communication/Notification/Gateway/Notification-Gateway.ts`) exposes a Socket.IO namespace at `/ws` with CORS enabled. On connection, it verifies the JWT and joins the client to a room: `user:<userId>`.

### Client Connection
Pass the JWT either as `handshake.auth.token` or in `Authorization: Bearer <token>` header.

```ts
const socket = io('wss://<server>/ws', { auth: { token: accessToken } });
```

### Server Emit API
From any injectable service with access to the gateway instance:

```ts
notificationGateway.emitToUser(userId, 'event-name', payload);
```

This will broadcast to the room `user:<userId>`.

## Security
- Ensure `JwtModule.register({ secret: <JWT_SECRET> })` is configured so verification succeeds.
- Consider rate limiting and disconnect policies for invalid tokens.

## Extending
- Add event contracts and acknowledgements
- Add persistence via a `Notification-Log` model to track deliveries
- Expose REST endpoints for notification preferences in a `Module` subfolder

