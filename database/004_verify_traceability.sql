/* Solo lectura. Esperado: las cuatro FK confiables y cero inconsistencias. */
USE PostulaTrack;
GO

SELECT name AS ConstraintName, is_disabled AS Disabled, is_not_trusted AS NotTrusted
FROM sys.foreign_keys
WHERE name IN (N'FK_Opportunities_Company_Owner', N'FK_Applications_Opportunity_Owner',
               N'FK_Activities_Application_Owner', N'FK_Documents_Application_Owner')
ORDER BY name;

IF (SELECT COUNT(*) FROM sys.foreign_keys
    WHERE name IN (N'FK_Opportunities_Company_Owner', N'FK_Applications_Opportunity_Owner',
                   N'FK_Activities_Application_Owner', N'FK_Documents_Application_Owner')
      AND is_disabled=0 AND is_not_trusted=0) <> 4
  THROW 51010, 'Falta alguna restriccion compuesta o no esta validada.', 1;

SELECT a.ApplicationId, a.OwnerUserId, a.CurrentStatusId, latest.NewStatusId,
       latest.ChangedAtUtc AS LastStatusChangeUtc
FROM app.Applications a
OUTER APPLY (SELECT TOP (1) h.NewStatusId, h.ChangedAtUtc
             FROM app.ApplicationStatusHistory h WHERE h.ApplicationId=a.ApplicationId
             ORDER BY h.HistoryId DESC) latest
WHERE a.IsDeleted=0 AND (latest.NewStatusId IS NULL OR latest.NewStatusId<>a.CurrentStatusId);

IF EXISTS (
  SELECT 1
  FROM app.Applications a
  OUTER APPLY (SELECT TOP (1) h.NewStatusId
               FROM app.ApplicationStatusHistory h WHERE h.ApplicationId=a.ApplicationId
               ORDER BY h.HistoryId DESC) latest
  WHERE a.IsDeleted=0 AND (latest.NewStatusId IS NULL OR latest.NewStatusId<>a.CurrentStatusId)
)
  THROW 51011, 'El estado actual no coincide con el ultimo registro del historial.', 1;

SELECT ActionCode, COUNT(*) AS LoggedEvents, MIN(CreatedAtUtc) AS FirstUtc, MAX(CreatedAtUtc) AS LastUtc
FROM audit.AuditLog
GROUP BY ActionCode
ORDER BY ActionCode;
GO
