# ADR 0003: Queue technology

## Status
Proposed

## Context
Outbox relay, integration sync, report generation require durable async work.

## Options
Redis-backed queue · SQS/PubSub · Postgres-only polling

## Recommendation
Managed cloud queue (SQS or Pub/Sub) for production; Redis or PG polling acceptable for local Sprint 0–2.

## Decision
Pending Platform Engineer + CTO before Sprint 4 worker productionization.
