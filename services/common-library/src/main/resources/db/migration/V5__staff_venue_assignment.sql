-- V5: Staff Venue Assignments
ALTER TABLE tenant_members ADD COLUMN assigned_venues VARCHAR(255) NULL DEFAULT NULL;
