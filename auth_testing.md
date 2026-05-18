# Auth Testing Playbook (Arix.help)

For Emergent Google Auth, seed a test session token directly into MongoDB:

```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@arix.help',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  role: 'free',
  auth_provider: 'google',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

Test backend:
```bash
curl -X GET "{API}/api/auth/me" -H "Authorization: Bearer {SESSION_TOKEN_OR_JWT}"
```

Playwright cookie injection:
```python
await page.context.add_cookies([{
    "name": "session_token", "value": "YOUR_SESSION_TOKEN",
    "domain": "your-app.preview.emergentagent.com",
    "path": "/", "httpOnly": True, "secure": True, "sameSite": "None",
}])
```

For password auth, use `/api/auth/register` and `/api/auth/login` and pass returned `token` as `Authorization: Bearer {token}`.
