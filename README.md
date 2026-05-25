# amb-be

Express + TypeScript backend for Circle.

## Scripts
- `npm run dev` - run dev server
- `npm run build` - compile to `dist`
- `npm run start` - run compiled server
- `npm run typecheck` - type-check only
- `npm run seed` - seed roles/users/follows/posts/messages
- `npm run seed:reset` - reset DB data then reseed

## Environment
Copy `.env.example` to `.env` and configure:
- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `FRONTEND_BFF_ORIGIN`
- `OTP_EXPIRES_MINUTES` (optional, default `10`)
- `MESSAGE_ENCRYPTION_KEY` (optional, defaults to `JWT_SECRET`)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (optional)

## API
### Auth
- `POST /auth/request-otp`
- `POST /auth/verify-otp`
- `POST /auth/logout`
- `GET /auth/me`

### Meta
- `GET /meta/roles`

### Users
- `GET /users`
- `GET /users/:id`
- `PATCH /users/me`
- `POST /users/me/avatar`

### Relationships
- `POST /relationships/:userId/follow`
- `DELETE /relationships/:userId/follow`
- `GET /relationships/followers`
- `GET /relationships/following`

### Posts
- `GET /posts/feed`
- `GET /posts/user/:userId`
- `POST /posts`

### Chat
- `GET /chat/rooms`
- `POST /chat/rooms`
- `GET /chat/rooms/:roomId/messages`

## Socket Events
- `chat:join-room`
- `chat:typing`
- `chat:message`
- emitted: `chat:message`, `chat:typing`, `chat:notification`, `chat:room-created`
