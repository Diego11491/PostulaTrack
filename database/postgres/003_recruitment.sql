-- Aplicar una vez después de 001_schema.sql. Puede repetirse sin borrar datos.
BEGIN;
CREATE TABLE IF NOT EXISTS app.organizations (
  organizationid integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name varchar(180) NOT NULL UNIQUE,
  isactive boolean NOT NULL DEFAULT true,
  createdbyuserid uuid NOT NULL REFERENCES sec.users(userid),
  createdatutc timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_organizations_normalizedname ON app.organizations(lower(btrim(name)));
CREATE TABLE IF NOT EXISTS app.organizationmembers (
  userid uuid PRIMARY KEY REFERENCES sec.users(userid),
  organizationid integer NOT NULL REFERENCES app.organizations(organizationid),
  assignedbyuserid uuid NOT NULL REFERENCES sec.users(userid),
  assignedatutc timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_organizationmembers_org ON app.organizationmembers(organizationid);
ALTER TABLE app.joboffers ADD COLUMN IF NOT EXISTS organizationid integer REFERENCES app.organizations(organizationid);
CREATE INDEX IF NOT EXISTS ix_joboffers_org ON app.joboffers(organizationid,createdatutc DESC) WHERE organizationid IS NOT NULL;
CREATE TABLE IF NOT EXISTS app.recruiterapplications (
  submissionid integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organizationid integer NOT NULL REFERENCES app.organizations(organizationid),
  jobofferid integer NOT NULL REFERENCES app.joboffers(jobofferid),
  applicantuserid uuid NOT NULL REFERENCES sec.users(userid),
  applicantname varchar(205) NOT NULL,
  applicantemail varchar(254) NOT NULL,
  consentatutc timestamptz NOT NULL DEFAULT now(),
  withdrawnatutc timestamptz,
  UNIQUE(jobofferid,applicantuserid)
);
CREATE INDEX IF NOT EXISTS ix_recruiterapplications_org ON app.recruiterapplications(organizationid,consentatutc DESC) WHERE withdrawnatutc IS NULL;
INSERT INTO sec.roles(name,description) VALUES ('RECRUITER','Reclutamiento de una organización asignada por ADMIN') ON CONFLICT(name) DO NOTHING;
INSERT INTO meta.schema_migrations(version) VALUES ('003_recruitment') ON CONFLICT DO NOTHING;
COMMIT;
