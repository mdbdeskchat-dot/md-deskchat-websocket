# Deploy WebSocket Server Update to Render.com

## Changes Made
- Added `message_deleted` event handler for real-time message deletion
- Receiver now sees deleted messages update in real-time

## Deployment Steps

### Option 1: Git Push (Recommended)
If your Render.com deployment is connected to a Git repository:

1. Commit the changes:
```bash
git add dashboards/MD\ DeskChat/websocket-server/server-optimized.js
git commit -m "Add real-time message deletion via WebSocket"
git push
```

2. Render.com will automatically detect the changes and redeploy

### Option 2: Manual Deployment via Render Dashboard

1. Go to https://dashboard.render.com
2. Find your `md-deskchat-websocket` service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait for deployment to complete (usually 1-2 minutes)

### Option 3: Redeploy from Local Files

If you need to redeploy from scratch:

1. Delete the old service on Render.com
2. Create a new Web Service
3. Connect to your repository or upload files
4. Use these settings:
   - **Build Command**: `npm install`
   - **Start Command**: `node server-optimized.js`
   - **Environment Variables**:
     - `DB_HOST`: 72.60.208.89
     - `DB_USER`: mdbm_deskchat
     - `DB_PASSWORD`: [your password]
     - `DB_NAME`: testMessage
     - `DEBUG`: false

## Verify Deployment

After deployment, test the real-time deletion:

1. Open chat as User A
2. Open chat as User B (different browser/incognito)
3. User A sends a message
4. User A deletes the message
5. User B should see "User A deleted a message" appear in real-time

## Current Server URL
https://md-deskchat-websocket.onrender.com

## Notes
- Free tier servers sleep after 15 minutes of inactivity
- The `keep_alive.php` script pings the server every 10 minutes to keep it awake
- Deployment usually takes 1-2 minutes
