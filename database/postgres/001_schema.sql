-- PostulaTrack: PostgreSQL 15+ (Supabase o Azure). Ejecutar una sola vez en una base vacía.
-- La API accede exclusivamente con una cadena de conexión privada; no se exponen estos esquemas por PostgREST.
BEGIN;
CREATE SCHEMA IF NOT EXISTS sec;
CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS meta;
CREATE TABLE IF NOT EXISTS meta.schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());

CREATE TABLE sec.roles (
  roleid smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name varchar(40) NOT NULL UNIQUE,
  description varchar(160),
  isactive boolean NOT NULL DEFAULT true,
  createdatutc timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sec.users (
  userid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(254) NOT NULL,
  passwordhash varchar(255) NOT NULL,
  emailverified boolean NOT NULL DEFAULT false,
  failedlogincount smallint NOT NULL DEFAULT 0 CHECK (failedlogincount BETWEEN 0 AND 255),
  lockeduntilutc timestamptz,
  isactive boolean NOT NULL DEFAULT true,
  createdatutc timestamptz NOT NULL DEFAULT now(),
  updatedatutc timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_users_email CHECK (email LIKE '%_@_%._%')
);
CREATE UNIQUE INDEX ux_users_normalizedemail ON sec.users (lower(btrim(email)));
CREATE TABLE sec.userroles (
  userid uuid NOT NULL REFERENCES sec.users(userid),
  roleid smallint NOT NULL REFERENCES sec.roles(roleid),
  assignedatutc timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (userid, roleid)
);
CREATE TABLE sec.sessions (
  sessionid integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  userid uuid NOT NULL REFERENCES sec.users(userid),
  sessiontokenhash bytea NOT NULL UNIQUE CHECK (octet_length(sessiontokenhash) = 32),
  expiresatutc timestamptz NOT NULL,
  revokedatutc timestamptz,
  ipaddress varchar(45),
  useragent varchar(300),
  createdatutc timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_sessions_user_expiry ON sec.sessions(userid, expiresatutc) WHERE revokedatutc IS NULL;

CREATE TABLE app.profiles (
  userid uuid PRIMARY KEY REFERENCES sec.users(userid),
  firstname varchar(80) NOT NULL,
  lastname varchar(120) NOT NULL,
  phone varchar(25),
  country varchar(100),
  city varchar(100),
  headline varchar(180),
  professionalsummary varchar(1000),
  educationlevel varchar(80),
  institution varchar(180),
  career varchar(160),
  graduationyear smallint CHECK (graduationyear BETWEEN 1950 AND 2200),
  updatedatutc timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE app.companies (
  companyid integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owneruserid uuid NOT NULL REFERENCES sec.users(userid),
  name varchar(180) NOT NULL,
  sector varchar(120),
  websiteurl varchar(500),
  contactname varchar(160),
  contactemail varchar(254),
  isdeleted boolean NOT NULL DEFAULT false,
  createdatutc timestamptz NOT NULL DEFAULT now(),
  updatedatutc timestamptz NOT NULL DEFAULT now(),
  UNIQUE (companyid, owneruserid)
);
CREATE UNIQUE INDEX ux_companies_owner_name ON app.companies(owneruserid, name) WHERE NOT isdeleted;
CREATE TABLE app.opportunities (
  opportunityid integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owneruserid uuid NOT NULL REFERENCES sec.users(userid),
  companyid integer NOT NULL,
  jobtitle varchar(180) NOT NULL,
  sourcename varchar(100),
  sourceurl varchar(1000),
  workmode varchar(20) CHECK (workmode IN ('REMOTE','HYBRID','ONSITE')),
  location varchar(180),
  publishedon date,
  closingon date,
  notes varchar(2000),
  isdeleted boolean NOT NULL DEFAULT false,
  createdatutc timestamptz NOT NULL DEFAULT now(),
  updatedatutc timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_opportunity_company_owner FOREIGN KEY (companyid, owneruserid) REFERENCES app.companies(companyid, owneruserid),
  CONSTRAINT ck_opportunity_dates CHECK (closingon IS NULL OR publishedon IS NULL OR closingon >= publishedon),
  UNIQUE (opportunityid, owneruserid)
);
CREATE INDEX ix_opportunities_owner_created ON app.opportunities(owneruserid, createdatutc DESC) WHERE NOT isdeleted;
CREATE TABLE app.applicationstatuses (
  statusid smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code varchar(30) NOT NULL UNIQUE,
  displayname varchar(80) NOT NULL,
  sortorder smallint NOT NULL,
  isterminal boolean NOT NULL DEFAULT false,
  isactive boolean NOT NULL DEFAULT true
);
CREATE TABLE app.applications (
  applicationid integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owneruserid uuid NOT NULL REFERENCES sec.users(userid),
  opportunityid integer NOT NULL,
  currentstatusid smallint NOT NULL REFERENCES app.applicationstatuses(statusid),
  appliedon date,
  nextaction varchar(250),
  nextactionatutc timestamptz,
  closedatutc timestamptz,
  isdeleted boolean NOT NULL DEFAULT false,
  createdatutc timestamptz NOT NULL DEFAULT now(),
  updatedatutc timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_application_opportunity_owner FOREIGN KEY (opportunityid, owneruserid) REFERENCES app.opportunities(opportunityid, owneruserid),
  UNIQUE (applicationid, owneruserid)
);
CREATE UNIQUE INDEX ux_applications_owner_opportunity ON app.applications(owneruserid, opportunityid) WHERE NOT isdeleted;
CREATE INDEX ix_applications_owner_status ON app.applications(owneruserid, currentstatusid, updatedatutc DESC) WHERE NOT isdeleted;
CREATE TABLE app.applicationstatushistory (
  historyid integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  applicationid integer NOT NULL REFERENCES app.applications(applicationid),
  previousstatusid smallint REFERENCES app.applicationstatuses(statusid),
  newstatusid smallint NOT NULL REFERENCES app.applicationstatuses(statusid),
  changedbyuserid uuid NOT NULL REFERENCES sec.users(userid),
  comment varchar(1000),
  changedatutc timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_history_application_id ON app.applicationstatushistory(applicationid, historyid DESC);
CREATE TABLE app.documents (
  documentid integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owneruserid uuid NOT NULL REFERENCES sec.users(userid),
  applicationid integer,
  documenttype varchar(30) NOT NULL,
  originalfilename varchar(255) NOT NULL,
  storagekey varchar(500) NOT NULL,
  contenttype varchar(120) NOT NULL,
  sizebytes bigint NOT NULL CHECK (sizebytes BETWEEN 1 AND 10485760),
  sha256 bytea NOT NULL CHECK (octet_length(sha256) = 32),
  versionnumber smallint NOT NULL DEFAULT 1,
  isdeleted boolean NOT NULL DEFAULT false,
  createdatutc timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_document_application_owner FOREIGN KEY (applicationid, owneruserid) REFERENCES app.applications(applicationid, owneruserid)
);
CREATE INDEX ix_documents_owner_application ON app.documents(owneruserid, applicationid, createdatutc DESC) WHERE NOT isdeleted;
CREATE TABLE app.activities (
  activityid integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owneruserid uuid NOT NULL REFERENCES sec.users(userid),
  applicationid integer,
  title varchar(180) NOT NULL,
  activitytype varchar(30) NOT NULL,
  dueatutc timestamptz NOT NULL,
  completedatutc timestamptz,
  reminderminutes integer CHECK (reminderminutes BETWEEN 0 AND 43200),
  notes varchar(1000),
  createdatutc timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_activity_application_owner FOREIGN KEY (applicationid, owneruserid) REFERENCES app.applications(applicationid, owneruserid)
);
CREATE INDEX ix_activities_owner_due ON app.activities(owneruserid, dueatutc);
CREATE TABLE app.joboffers (
  jobofferid integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  jobtitle varchar(180) NOT NULL,
  companyname varchar(180) NOT NULL,
  sector varchar(120),
  location varchar(180),
  workmode varchar(20) CHECK (workmode IN ('REMOTE','HYBRID','ONSITE')),
  requirementssummary varchar(2000) NOT NULL,
  sourcename varchar(100) NOT NULL,
  sourceurl varchar(1000) NOT NULL,
  publishedon date,
  closingon date,
  isactive boolean NOT NULL DEFAULT true,
  createdbyuserid uuid NOT NULL REFERENCES sec.users(userid),
  createdatutc timestamptz NOT NULL DEFAULT now(),
  updatedatutc timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_joboffer_dates CHECK (closingon IS NULL OR publishedon IS NULL OR closingon >= publishedon)
);
CREATE INDEX ix_joboffers_active_created ON app.joboffers(createdatutc DESC, jobofferid DESC) WHERE isactive;
CREATE TABLE audit.auditlog (
  auditid integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  userid uuid REFERENCES sec.users(userid),
  actioncode varchar(60) NOT NULL,
  entitytype varchar(60) NOT NULL,
  entityid varchar(80),
  resultcode varchar(20) NOT NULL,
  ipaddress varchar(45),
  correlationid uuid NOT NULL DEFAULT gen_random_uuid(),
  detailsjson jsonb,
  createdatutc timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_audit_user_date ON audit.auditlog(userid, createdatutc DESC);
INSERT INTO sec.roles(name,description) VALUES
 ('USER','Usuario que gestiona sus datos privados'),('ADMIN','Soporte de cuentas y publicación de ofertas')
ON CONFLICT(name) DO NOTHING;
INSERT INTO app.applicationstatuses(code,displayname,sortorder,isterminal) VALUES
 ('REGISTERED','Registrada',10,false),('SENT','Postulación enviada',20,false),
 ('PRESELECTED','Preselección',30,false),('INTERVIEW','Entrevista',40,false),
 ('ASSESSMENT','Evaluación',50,false),('OFFER','Oferta',60,false),
 ('HIRED','Contratación',70,true),('REJECTED','Descartada',80,true),('WITHDRAWN','Retirada',90,true)
ON CONFLICT(code) DO NOTHING;
INSERT INTO meta.schema_migrations(version) VALUES ('001_schema') ON CONFLICT DO NOTHING;
COMMIT;
