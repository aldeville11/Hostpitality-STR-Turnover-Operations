# ADR 0002: Authentication mechanism

## Status
Proposed

## Context
Web app needs secure browser auth; Enterprise SSO arrives in P1.

## Options
1. HTTP-only cookie sessions  
2. Bearer JWT in localStorage (rejected for XSS risk as primary)  
3. Cookie session + BFF

## Recommendation
Cookie-based sessions (Secure, HttpOnly, SameSite) for P0; OIDC/SAML enterprise SSO in P1 without changing app session issuance.

## Decision
Pending Backend Lead + Security Engineer sign-off before Sprint 1 merge.
