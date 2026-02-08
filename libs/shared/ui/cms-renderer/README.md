# Payload Components for Clients

These components are designed to be used by clients that depends on Payload headless CMS.

The client fetches data from Payload API and use one or many of the components to render the UI.

## External clients outside `cms`

External clients that doesn't run within the Payload runtime communicates using `PayloadProvider`, a bridge between the client and Payload is via React context. It must be used near the application root.

## Server-side requirements

The components must be designed for server-side rendering, to be fully compatible with any type of React clients.

## Language support

**This is not yet in place!**

Is the solution to add the current language to `PayloadProvider`?

## Types

Payload types are used in this project to get type safe components.
