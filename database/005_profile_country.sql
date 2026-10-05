/* Migración aditiva para instalaciones existentes. Ejecutar en SSMS sobre PostulaTrack
   antes de iniciar API/web actualizadas. Hacer backup primero. No elimina datos. */
USE PostulaTrack;
GO
SET XACT_ABORT ON;
BEGIN TRY
  BEGIN TRANSACTION;
  IF OBJECT_ID(N'app.Profiles', N'U') IS NULL
    THROW 51020, 'No existe app.Profiles. Instala primero 001_schema.sql.', 1;
  IF COL_LENGTH(N'app.Profiles', N'Country') IS NULL
    ALTER TABLE app.Profiles ADD Country NVARCHAR(100) NULL;
  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
GO
SELECT name, max_length, is_nullable
FROM sys.columns WHERE object_id=OBJECT_ID(N'app.Profiles') AND name=N'Country';
GO
