# SOLess Shared Authentication Service

A comprehensive authentication service for the SOLess ecosystem, providing wallet-based authentication and session management.

## Features

- 🔐 Wallet-based authentication
- 🎫 JWT session management  
- 👥 Role-based access control
- 🔄 Multi-signature support
- ⚡ React hooks integration

## Installation

```bash
npm install @soless/shared-auth
```

## Quick Start

```typescript
import { AuthProvider, useAuth } from '@soless/shared-auth';

function App() {
  return (
    <AuthProvider>
      <YourApp />
    </AuthProvider>
  );
}

function YourComponent() {
  const { isAuthenticated, user, login, logout } = useAuth();
  
  return (
    <div>
      {isAuthenticated ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <button onClick={login}>Connect Wallet</button>
      )}
    </div>
  );
}
```

## API Reference

### Hooks

- `useAuth()` - Main authentication hook
- `useWalletAuth()` - Wallet-specific authentication
- `useSession()` - Session management

### Components

- `AuthProvider` - Authentication context provider
- `ProtectedRoute` - Route protection component
- `LoginButton` - Pre-built login component

## Development

```bash
npm run dev     # Watch mode
npm run build   # Build package
npm run test    # Run tests
```

## License

MIT
