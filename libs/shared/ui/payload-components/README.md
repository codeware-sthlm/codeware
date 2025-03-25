# Payload Components for Clients

These components are designed to be used by clients that depends on Payload headless CMS.

The client fetches data from Payload API and use one or many of the components to render the UI.

The reason for scoping to clients is the dependency to `RenderBlocksProvider` that must be used near the application root, and the fact that the components converts Api data to React elements.

## Types

Payload types are used in this project to get type safe components.

## Enforce module boundaries

To enforce this contraint the project have the tag `domain:client`, which is a forbidden tag for `scope:app` and `scope:app-cms`.
