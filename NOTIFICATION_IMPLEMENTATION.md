# Notification System Implementation

## Overview
This implementation adds browser notification support to Learnix, allowing users to receive push notifications about new topics, updates, and other important information.

## Files Created/Modified

### 1. API Routes

#### `/api/notifications/send/route.js` (POST)
Endpoint to send notifications to users.

**Request Body:**
```json
{
  "title": "New Topic Added!",
  "message": "Check out the latest notes on Data Structures",
  "icon": "/favicon.ico",
  "badge": "/favicon.ico",
  "url": "/works/123456",
  "tag": "new-topic"
}
```

**Required Fields:**
- `title` (string): The notification title
- `message` (string): The notification message body

**Optional Fields:**
- `icon` (string): URL to notification icon (default: /favicon.ico)
- `badge` (string): URL to notification badge (default: /favicon.ico)
- `url` (string): URL to navigate when notification is clicked (default: /)
- `tag` (string): Notification tag for grouping (default: learnix-notification)

**Response:**
```json
{
  "success": true,
  "message": "Notification queued successfully",
  "data": {
    "title": "New Topic Added!",
    "body": "Check out the latest notes on Data Structures",
    "icon": "/favicon.ico",
    "badge": "/favicon.ico",
    "url": "/works/123456",
    "tag": "new-topic",
    "timestamp": "2025-12-08T10:30:00.000Z"
  }
}
```

#### `/api/notifications/subscribe/route.js` (POST)
Endpoint to subscribe a user to push notifications.

**Request Body:**
```json
{
  "usn": "1MS21CS123",
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "BNcRd...",
      "auth": "tBHIt..."
    }
  }
}
```

**Required Fields:**
- `usn` (string): User's USN
- `subscription` (object): Push subscription object from browser
  - `endpoint` (string): Push service endpoint
  - `keys` (object): Encryption keys
    - `p256dh` (string): Public key
    - `auth` (string): Authentication secret

**Response:**
```json
{
  "success": true,
  "message": "Notification subscription saved successfully"
}
```

#### `/api/notifications/subscribe/route.js` (DELETE)
Endpoint to unsubscribe a user from push notifications.

**Query Parameters:**
- `usn` (string): User's USN

**Example:** `DELETE /api/notifications/subscribe?usn=1MS21CS123`

**Response:**
```json
{
  "success": true,
  "message": "Notification subscription removed successfully"
}
```

### 2. Frontend Implementation

#### `WorkSearchInterface.js`
Added notification permission request logic that:
- Requests notification permission when the component mounts
- Shows a welcome notification when permission is granted
- Tracks permission state in component state

**Key Features:**
- Automatic permission request on page load
- Browser compatibility check
- Welcome notification on successful permission grant
- Permission state tracking

## Usage Examples

### Sending a Notification (Backend)

You can call the send notification API from anywhere in your backend:

```javascript
// Example: Send notification when new topic is uploaded
const sendNotification = async (topicData) => {
  const response = await fetch('http://localhost:3000/api/notifications/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'New Topic Added!',
      message: `${topicData.userName} uploaded notes on ${topicData.topic}`,
      icon: '/favicon.ico',
      url: `/works/${topicData.topicId}`,
      tag: 'new-topic'
    })
  });
  
  const result = await response.json();
  console.log(result);
};
```

### Using cURL

```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Topic Added!",
    "message": "Check out the latest Data Structures notes",
    "url": "/works/12345",
    "tag": "new-topic"
  }'
```

### Using Postman

1. **Method:** POST
2. **URL:** `http://localhost:3000/api/notifications/send`
3. **Headers:** 
   - Content-Type: application/json
4. **Body (raw JSON):**
```json
{
  "title": "New Topic Added!",
  "message": "Check out the latest Data Structures notes",
  "icon": "/favicon.ico",
  "url": "/works/12345"
}
```

## Next Steps (For Full Implementation)

To make this a complete push notification system, you would need to:

1. **Install web-push package:**
```bash
npm install web-push
```

2. **Generate VAPID keys:**
```bash
npx web-push generate-vapid-keys
```

3. **Add VAPID keys to `.env.local`:**
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:your@email.com
```

4. **Update Work Model** to include notification subscription field:
```javascript
notificationSubscription: {
  endpoint: String,
  keys: {
    p256dh: String,
    auth: String
  },
  subscribedAt: Date
}
```

5. **Implement Service Worker** for handling push notifications in the background

6. **Update send notification route** to actually send push notifications using web-push library

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Limited support (iOS 16.4+)
- Opera: Full support

## Security Considerations

- Notifications require HTTPS in production
- Permission should only be requested in response to user action
- Store subscription data securely
- Validate all notification content before sending
- Implement rate limiting to prevent spam

## Notes

- The current implementation requests permission automatically on page load
- A welcome notification is shown when permission is granted
- The `/api/notifications/send` endpoint is ready to use but doesn't actually send push notifications yet
- You need to implement the web-push integration for full functionality
