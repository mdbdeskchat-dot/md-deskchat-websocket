# MD DeskChat WebSocket Server

Real-time WebSocket server for MD DeskChat messaging system using Socket.IO.

## Features

- Real-time message delivery (<100ms)
- Online/offline status tracking
- Typing indicators
- Message status updates (sent, delivered, seen)
- Auto-reconnection
- Scalable to 1000+ users

## Deployment

This server is deployed on Cyclic.sh for 24/7 uptime.

### Local Development

```bash
npm install
npm start
```

Server will run on http://localhost:3000

### Environment Variables

- `PORT` - Server port (default: 3000)

## API Endpoints

### Health Check
```
GET /
Returns server status and connection count
```

## Socket.IO Events

### Client → Server

- `join` - User joins with their ID
- `send_message` - Send a message
- `mark_seen` - Mark message as seen
- `typing` - Send typing indicator

### Server → Client

- `new_message` - Receive new message
- `message_sent` - Confirmation of sent message
- `message_seen` - Message was seen by receiver
- `user_online` - User online/offline status
- `user_typing` - User is typing
- `error` - Error occurred

## Database

Connects to remote MySQL database at 72.60.208.89

## License

MIT
