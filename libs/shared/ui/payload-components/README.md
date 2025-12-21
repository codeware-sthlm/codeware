# Payload Components for Clients

These components are designed to be used by clients that depends on Payload headless CMS.

The client fetches data from Payload API and use one or many of the components to render the UI.

The reason for scoping to clients is the dependency to `PayloadProvider` that must be used near the application root, and the fact that the components converts Api data to React elements.

## Server-side requirements

The components must be designed for server-side rendering, to be fully compatible with any type of React clients.

The bridge between the client and Payload is via React context and `PayloadProvider`.

## Language support

**This is not yet in place!**

Is the solution to add the current language to `PayloadProvider`?

## Types

Payload types are used in this project to get type safe components.

## Enforce module boundaries

To enforce this constraint, the project have tag `domain:client`, which is a forbidden tag for `scope:app` and `scope:app-cms`.
