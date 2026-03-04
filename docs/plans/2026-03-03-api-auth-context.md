# API Auth Context Migration

## Scope
- Replace Supabase email/password auth state with custom API auth using `EXPO_PUBLIC_API_URL`.
- Store access and refresh tokens in `expo-secure-store`.
- Update login and signup screens to use the shared auth context instead of calling Supabase directly.

## Constraints
- Keep the existing `useAuth()` consumer shape usable for current screens (`user`, `loading`, `signOut`).
- Do not assume `/auth/register` returns tokens.
- Avoid breaking route guards and screens that only need auth presence plus `user.email`.

## Failure Modes
- Empty or non-JSON responses from `register`, `logout`, or error cases.
- Missing `EXPO_PUBLIC_API_URL`.
- Missing stored user data during refresh after app restart.

## Verification
- Run `npx tsc --noEmit`.
- Inspect diff for the auth files touched.

## Rollback
- Revert `lib/AuthContext.tsx`, `screens/LoginRegister/LoginScreen.tsx`, and `screens/LoginRegister/SignupScreen.tsx`.
