# Arix.help — Test Credentials

## Test User (JWT email/password auth)
- Email: `test.dev@arix.help`
- Password: `Arix2026!`
- Role: free

Create via:
`curl -X POST {API}/api/auth/register -H 'Content-Type: application/json' -d '{"email":"test.dev@arix.help","password":"Arix2026!","name":"Test Dev"}'`

## Admin User (for /admin route)
- Email: `admin@arix.help`
- Password: `AdminPass!2026`
- Role: admin (must be set via mongo: `db.users.updateOne({email:"admin@arix.help"},{$set:{role:"admin"}})`)

## Google OAuth Test
- Use Emergent-managed Google Auth. Click "Continue with Google" on /login or /signup.
- Flow: button → `https://auth.emergentagent.com/?redirect={origin}/dashboard` → returns with `#session_id=...` → app POSTs `/api/auth/google/session` → cookie set.
- For automated testing, seed a fake session per `/app/auth_testing.md`.
