# ADR 0006: Message body storage & encryption

## Status
Proposed

## Context
Conversations/SMS/Email bodies are PII; Constitution requires encryption for sensitive fields.

## Recommendation
Store bodies encrypted at rest (app-level field encryption or provider-managed); never log raw bodies; retention policy documented.

## Decision
Pending Security Engineer before Sprint 7+ message persistence.
