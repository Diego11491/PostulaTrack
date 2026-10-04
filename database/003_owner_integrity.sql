/*
  PostulaTrack, migración aditiva sobre 001_schema.sql.
  Refuerza pertenencia entre filas del mismo usuario; no borra ni transforma datos.
  Ejecutar con permisos DDL después de una copia de seguridad y revisar los bloqueos
  durante una ventana sin escrituras. Si hay relaciones cruzadas, falla sin cambiar nada.
*/
USE PostulaTrack;
GO

SET XACT_ABORT ON;
BEGIN TRY
  BEGIN TRANSACTION;

  IF EXISTS (SELECT 1 FROM app.Opportunities o JOIN app.Companies c ON c.CompanyId=o.CompanyId
             WHERE o.OwnerUserId <> c.OwnerUserId)
    THROW 51001, 'Hay oportunidades con empresas de otro usuario.', 1;

  IF EXISTS (SELECT 1 FROM app.Applications a JOIN app.Opportunities o ON o.OpportunityId=a.OpportunityId
             WHERE a.OwnerUserId <> o.OwnerUserId)
    THROW 51002, 'Hay postulaciones con oportunidades de otro usuario.', 1;

  IF EXISTS (SELECT 1 FROM app.Activities x JOIN app.Applications a ON a.ApplicationId=x.ApplicationId
             WHERE x.OwnerUserId <> a.OwnerUserId)
    THROW 51003, 'Hay actividades con postulaciones de otro usuario.', 1;

  IF EXISTS (SELECT 1 FROM app.Documents d JOIN app.Applications a ON a.ApplicationId=d.ApplicationId
             WHERE d.OwnerUserId <> a.OwnerUserId)
    THROW 51004, 'Hay documentos con postulaciones de otro usuario.', 1;

  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'app.Companies') AND name=N'UX_Companies_Id_Owner')
    CREATE UNIQUE INDEX UX_Companies_Id_Owner ON app.Companies(CompanyId, OwnerUserId);
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'app.Opportunities') AND name=N'UX_Opportunities_Id_Owner')
    CREATE UNIQUE INDEX UX_Opportunities_Id_Owner ON app.Opportunities(OpportunityId, OwnerUserId);
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'app.Applications') AND name=N'UX_Applications_Id_Owner')
    CREATE UNIQUE INDEX UX_Applications_Id_Owner ON app.Applications(ApplicationId, OwnerUserId);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_Opportunities_Company_Owner' AND parent_object_id=OBJECT_ID(N'app.Opportunities'))
    ALTER TABLE app.Opportunities WITH CHECK ADD CONSTRAINT FK_Opportunities_Company_Owner
      FOREIGN KEY (CompanyId, OwnerUserId) REFERENCES app.Companies(CompanyId, OwnerUserId);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_Applications_Opportunity_Owner' AND parent_object_id=OBJECT_ID(N'app.Applications'))
    ALTER TABLE app.Applications WITH CHECK ADD CONSTRAINT FK_Applications_Opportunity_Owner
      FOREIGN KEY (OpportunityId, OwnerUserId) REFERENCES app.Opportunities(OpportunityId, OwnerUserId);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_Activities_Application_Owner' AND parent_object_id=OBJECT_ID(N'app.Activities'))
    ALTER TABLE app.Activities WITH CHECK ADD CONSTRAINT FK_Activities_Application_Owner
      FOREIGN KEY (ApplicationId, OwnerUserId) REFERENCES app.Applications(ApplicationId, OwnerUserId);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_Documents_Application_Owner' AND parent_object_id=OBJECT_ID(N'app.Documents'))
    ALTER TABLE app.Documents WITH CHECK ADD CONSTRAINT FK_Documents_Application_Owner
      FOREIGN KEY (ApplicationId, OwnerUserId) REFERENCES app.Applications(ApplicationId, OwnerUserId);

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
GO
