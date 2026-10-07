-- Debe ejecutarse después de 001_schema.sql. Genera error si faltan estructuras o datos básicos.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM meta.schema_migrations WHERE version='001_schema') THEN
    RAISE EXCEPTION 'Falta 001_schema';
  END IF;
  IF (SELECT count(*) FROM sec.roles WHERE name IN ('USER','ADMIN')) <> 2 THEN
    RAISE EXCEPTION 'Roles incompletos';
  END IF;
  IF (SELECT count(*) FROM app.applicationstatuses) <> 9 THEN
    RAISE EXCEPTION 'Catálogo de estados incompleto';
  END IF;
  IF to_regclass('app.joboffers') IS NULL THEN
    RAISE EXCEPTION 'Falta tabla de ofertas';
  END IF;
  IF EXISTS (
    SELECT 1 FROM app.applications a
    LEFT JOIN LATERAL (SELECT newstatusid FROM app.applicationstatushistory h
      WHERE h.applicationid=a.applicationid ORDER BY historyid DESC LIMIT 1) h ON true
    WHERE NOT a.isdeleted AND (h.newstatusid IS NULL OR h.newstatusid <> a.currentstatusid)
  ) THEN RAISE EXCEPTION 'Estado actual e historial no coinciden'; END IF;
END $$;
SELECT version, applied_at FROM meta.schema_migrations ORDER BY version;
