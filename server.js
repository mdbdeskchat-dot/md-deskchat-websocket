const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mysql = require('mysql2/promise');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'running',
        service: 'MD DeskChat WebSocket Server',
        timestamp: new Date().toISOString(),
        connections: onlineUsers.size
    });
});

// Database connection pool
const pool = mysql.createPool({
    host: '72.60.208.89',
    user: 'itdep',
    password: 'MDbmcorp.it@123',
    database: 'testMessage',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Track online users
const onlineUsers = new Map();

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);
    
    // User joins with their ID
    socket.on('join', (userId) => {
        socket.userId = userId;
        onlineUsers.set(userId, socket.id);
        
        console.log(`👤 User ${userId} joined (${onlineUsers.size} online)`);
        
        // Broadcast online status to all users
        io.emit('user_online', { 
            userId: userId, 
            isOnline: true 
        });
    });
    
    // Send message
    socket.on('send_message', async (data) => {
        try {
            console.log(`📤 Sending message from ${data.senderId} to ${data.receiverId}`);
            
            // Save to database
            const [result] = await pool.execute(
                'INSERT INTO Messages (SenderId, ReceiverId, MessageText, status, CreatedAt) VALUES (?, ?, ?, ?, NOW())',
                [data.senderId, data.receiverId, data.text, 'sent']
            );
            
            const messageId = result.insertId;
            
            // Check if receiver is online
            const receiverSocketId = onlineUsers.get(data.receiverId);
            
            if (receiverSocketId) {
                // Send to receiver
                io.to(receiverSocketId).emit('new_message', {
                    id: messageId,
                    senderId: data.senderId,
                    receiverId: data.receiverId,
                    text: data.text,
                    timestamp: new Date(),
                    isOwn: false,
                    status: 'delivered'
                });
                
                // Update status to delivered
                await pool.execute(
                    'UPDATE Messages SET status = ? WHERE Id = ?',
                    ['delivered', messageId]
                );
                
                console.log(`✅ Message ${messageId} delivered to user ${data.receiverId}`);
            } else {
                console.log(`⚠️ User ${data.receiverId} is offline, message saved`);
            }
            
            // Confirm to sender
            socket.emit('message_sent', { 
                messageId: messageId,
                tempId: data.tempId, // For client-side matching
                status: receiverSocketId ? 'delivered' : 'sent'
            });
            
        } catch (error) {
            console.error('❌ Send message error:', error);
            socket.emit('error', { 
                message: 'Failed to send message',
                error: error.message 
            });
        }
    });
    
    // Mark message as seen
    socket.on('mark_seen', async (data) => {
        try {
            console.log(`👁️ Marking message ${data.messageId} as seen`);
            
            // Update message status
            await pool.execute(
                'UPDATE Messages SET status = ?, IsRead = 1 WHERE Id = ?',
                ['seen', data.messageId]
            );
            
            // Notify sender if online
            const senderSocketId = onlineUsers.get(data.senderId);
            if (senderSocketId) {
                io.to(senderSocketId).emit('message_seen', {
                    messageId: data.messageId
                });
                console.log(`✅ Notified sender ${data.senderId} that message was seen`);
            }
            
        } catch (error) {
            console.error('❌ Mark seen error:', error);
        }
    });
    
    // Typing indicator
    socket.on('typing', (data) => {
        const receiverSocketId = onlineUsers.get(data.receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('user_typing', {
                userId: data.senderId,
                isTyping: data.isTyping
            });
        }
    });
    
    // User disconnect
    socket.on('disconnect', () => {
        if (socket.userId) {
            onlineUsers.delete(socket.userId);
            
            console.log(`👋 User ${socket.userId} disconnected (${onlineUsers.size} online)`);
            
            // Broadcast offline status
            io.emit('user_online', { 
                userId: socket.userId, 
                isOnline: false 
            });
        } else {
            console.log('❌ User disconnected:', socket.id);
        }
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 MD DeskChat WebSocket Server running on port ${PORT}`);
    console.log(`📡 Ready to accept connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('⚠️ SIGTERM received, closing server...');
    server.close(() => {
        console.log('✅ Server closed');
        pool.end();
        process.exit(0);
    });
});
