# Collection-specific data access functions

These functions provide abstractions for fetching Payload collection data with proper authentication, tenant scoping, and access control.

All functions require an `AuthenticatedPayload` instance and handles:

- Proper access control (`overrideAccess: false`)
- User context for tenant scoping
- Response transformation where applicable
- Type safety with Payload generated types
