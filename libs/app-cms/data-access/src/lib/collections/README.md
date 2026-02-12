# Collection-specific data access functions

These functions provide abstractions for CRUD operations on Payload collections with proper authentication, tenant scoping, and access control.

All functions require an `AuthenticatedPayload` instance and handles:

- Proper access control utilizing `overrideAccess: false`
- User context for tenant scoping via `user` property
- Response transformation where applicable
- Type safety with Payload generated types
