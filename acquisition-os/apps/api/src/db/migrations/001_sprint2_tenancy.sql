-- Sprint 2 tenancy + durable identity (ADR 0002 / 0005)
-- Apply via migrate.ts against Postgres or PGlite

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT,
  status TEXT NOT NULL CHECK (status IN ('invited', 'active', 'deactivated')),
  created_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS invites (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  invited_by_user_id TEXT REFERENCES users(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('independent', 'multi_location', 'franchise', 'pe_portfolio', 'partner')),
  billing_entity TEXT,
  status TEXT NOT NULL CHECK (status IN ('prospect', 'active', 'suspended', 'churned')),
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  timezone TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  gbp_link TEXT,
  status TEXT NOT NULL CHECK (status IN ('setup', 'live', 'paused', 'closed')),
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS locations_org_idx ON locations(organization_id);

CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  plan_tier TEXT NOT NULL DEFAULT 'standard',
  settings_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('provisioning', 'active', 'locked')),
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS workspaces_org_idx ON workspaces(organization_id);

CREATE TABLE IF NOT EXISTS workspace_locations (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL REFERENCES locations(id),
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  PRIMARY KEY (workspace_id, location_id)
);

CREATE INDEX IF NOT EXISTS workspace_locations_org_idx ON workspace_locations(organization_id);

CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  role_key TEXT NOT NULL,
  location_scope_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL CHECK (status IN ('invited', 'active', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE (user_id, workspace_id)
);

CREATE INDEX IF NOT EXISTS memberships_org_idx ON memberships(organization_id);
CREATE INDEX IF NOT EXISTS memberships_user_idx ON memberships(user_id);

CREATE TABLE IF NOT EXISTS domain_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  organization_id TEXT,
  workspace_id TEXT,
  payload_json TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS domain_events_org_idx ON domain_events(organization_id);
CREATE INDEX IF NOT EXISTS domain_events_type_idx ON domain_events(type);
