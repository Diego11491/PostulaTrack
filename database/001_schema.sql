/*
  PostulaTrack - esquema inicial para Microsoft SQL Server 2022 local
  Objetivo: autenticación, perfil, oportunidades, postulaciones e historial trazable.
  La aplicación debe conectarse con un usuario de mínimo privilegio. No usar sa.
*/

IF DB_ID(N'PostulaTrack') IS NULL
BEGIN
    CREATE DATABASE PostulaTrack;
END;
GO

USE PostulaTrack;
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'sec') EXEC(N'CREATE SCHEMA sec');
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'app') EXEC(N'CREATE SCHEMA app');
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'audit') EXEC(N'CREATE SCHEMA audit');
GO

CREATE TABLE sec.Roles (
    RoleId              SMALLINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Roles PRIMARY KEY,
    Name                NVARCHAR(40) NOT NULL CONSTRAINT UQ_Roles_Name UNIQUE,
    Description         NVARCHAR(160) NULL,
    IsActive            BIT NOT NULL CONSTRAINT DF_Roles_IsActive DEFAULT (1),
    CreatedAtUtc        DATETIME2(0) NOT NULL CONSTRAINT DF_Roles_CreatedAt DEFAULT (SYSUTCDATETIME())
);
GO

CREATE TABLE sec.Users (
    UserId              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Users PRIMARY KEY DEFAULT (NEWSEQUENTIALID()),
    Email               NVARCHAR(254) NOT NULL,
    NormalizedEmail     AS UPPER(LTRIM(RTRIM(Email))) PERSISTED,
    PasswordHash        NVARCHAR(255) NOT NULL,
    EmailVerified       BIT NOT NULL CONSTRAINT DF_Users_EmailVerified DEFAULT (0),
    FailedLoginCount    TINYINT NOT NULL CONSTRAINT DF_Users_FailedLogin DEFAULT (0),
    LockedUntilUtc      DATETIME2(0) NULL,
    IsActive            BIT NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT (1),
    CreatedAtUtc        DATETIME2(0) NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAtUtc        DATETIME2(0) NOT NULL CONSTRAINT DF_Users_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    RowVersion          ROWVERSION NOT NULL,
    CONSTRAINT CK_Users_Email CHECK (Email LIKE N'%_@_%._%')
);
GO
CREATE UNIQUE INDEX UX_Users_NormalizedEmail ON sec.Users(NormalizedEmail);
GO

CREATE TABLE sec.UserRoles (
    UserId              UNIQUEIDENTIFIER NOT NULL,
    RoleId              SMALLINT NOT NULL,
    AssignedAtUtc       DATETIME2(0) NOT NULL CONSTRAINT DF_UserRoles_AssignedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_UserRoles PRIMARY KEY (UserId, RoleId),
    CONSTRAINT FK_UserRoles_User FOREIGN KEY (UserId) REFERENCES sec.Users(UserId),
    CONSTRAINT FK_UserRoles_Role FOREIGN KEY (RoleId) REFERENCES sec.Roles(RoleId)
);
GO

CREATE TABLE sec.RefreshTokens (
    RefreshTokenId      BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_RefreshTokens PRIMARY KEY,
    UserId              UNIQUEIDENTIFIER NOT NULL,
    TokenHash           VARBINARY(64) NOT NULL,
    ExpiresAtUtc        DATETIME2(0) NOT NULL,
    RevokedAtUtc        DATETIME2(0) NULL,
    CreatedAtUtc        DATETIME2(0) NOT NULL CONSTRAINT DF_RefreshTokens_CreatedAt DEFAULT (SYSUTCDATETIME()),
    CreatedByIp         VARCHAR(45) NULL,
    CONSTRAINT FK_RefreshTokens_User FOREIGN KEY (UserId) REFERENCES sec.Users(UserId)
);
GO
CREATE UNIQUE INDEX UX_RefreshTokens_TokenHash ON sec.RefreshTokens(TokenHash);
CREATE INDEX IX_RefreshTokens_User_Expiry ON sec.RefreshTokens(UserId, ExpiresAtUtc) INCLUDE (RevokedAtUtc);
GO

CREATE TABLE sec.Sessions (
    SessionId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Sessions PRIMARY KEY,
    UserId UNIQUEIDENTIFIER NOT NULL,
    SessionTokenHash BINARY(32) NOT NULL,
    ExpiresAtUtc DATETIME2(0) NOT NULL,
    RevokedAtUtc DATETIME2(0) NULL,
    IpAddress VARCHAR(45) NULL,
    UserAgent NVARCHAR(300) NULL,
    CreatedAtUtc DATETIME2(0) NOT NULL CONSTRAINT DF_Sessions_CreatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_Sessions_User FOREIGN KEY (UserId) REFERENCES sec.Users(UserId)
);
GO
CREATE UNIQUE INDEX UX_Sessions_TokenHash ON sec.Sessions(SessionTokenHash);
CREATE INDEX IX_Sessions_User_Expiry ON sec.Sessions(UserId, ExpiresAtUtc) INCLUDE (RevokedAtUtc);
GO

CREATE TABLE app.Profiles (
    UserId              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Profiles PRIMARY KEY,
    FirstName           NVARCHAR(80) NOT NULL,
    LastName            NVARCHAR(120) NOT NULL,
    Phone               NVARCHAR(25) NULL,
    City                NVARCHAR(100) NULL,
    Headline            NVARCHAR(180) NULL,
    ProfessionalSummary NVARCHAR(1000) NULL,
    EducationLevel      NVARCHAR(80) NULL,
    Institution         NVARCHAR(180) NULL,
    Career              NVARCHAR(160) NULL,
    GraduationYear      SMALLINT NULL,
    UpdatedAtUtc        DATETIME2(0) NOT NULL CONSTRAINT DF_Profiles_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    RowVersion          ROWVERSION NOT NULL,
    CONSTRAINT FK_Profiles_User FOREIGN KEY (UserId) REFERENCES sec.Users(UserId),
    CONSTRAINT CK_Profiles_GraduationYear CHECK (GraduationYear IS NULL OR GraduationYear BETWEEN 1950 AND 2200)
);
GO

CREATE TABLE app.Companies (
    CompanyId           BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Companies PRIMARY KEY,
    OwnerUserId         UNIQUEIDENTIFIER NOT NULL,
    Name                NVARCHAR(180) NOT NULL,
    Sector              NVARCHAR(120) NULL,
    WebsiteUrl          NVARCHAR(500) NULL,
    ContactName         NVARCHAR(160) NULL,
    ContactEmail        NVARCHAR(254) NULL,
    IsDeleted           BIT NOT NULL CONSTRAINT DF_Companies_IsDeleted DEFAULT (0),
    CreatedAtUtc        DATETIME2(0) NOT NULL CONSTRAINT DF_Companies_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAtUtc        DATETIME2(0) NOT NULL CONSTRAINT DF_Companies_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    RowVersion          ROWVERSION NOT NULL,
    CONSTRAINT FK_Companies_Owner FOREIGN KEY (OwnerUserId) REFERENCES sec.Users(UserId)
);
GO
CREATE UNIQUE INDEX UX_Companies_Owner_Name ON app.Companies(OwnerUserId, Name) WHERE IsDeleted = 0;
GO

CREATE TABLE app.Opportunities (
    OpportunityId       BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Opportunities PRIMARY KEY,
    OwnerUserId         UNIQUEIDENTIFIER NOT NULL,
    CompanyId           BIGINT NOT NULL,
    JobTitle            NVARCHAR(180) NOT NULL,
    SourceName          NVARCHAR(100) NULL,
    SourceUrl           NVARCHAR(1000) NULL,
    WorkMode            VARCHAR(20) NULL,
    Location            NVARCHAR(180) NULL,
    PublishedOn         DATE NULL,
    ClosingOn           DATE NULL,
    Notes               NVARCHAR(2000) NULL,
    IsDeleted           BIT NOT NULL CONSTRAINT DF_Opportunities_IsDeleted DEFAULT (0),
    CreatedAtUtc        DATETIME2(0) NOT NULL CONSTRAINT DF_Opportunities_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAtUtc        DATETIME2(0) NOT NULL CONSTRAINT DF_Opportunities_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    RowVersion          ROWVERSION NOT NULL,
    CONSTRAINT FK_Opportunities_Owner FOREIGN KEY (OwnerUserId) REFERENCES sec.Users(UserId),
    CONSTRAINT FK_Opportunities_Company FOREIGN KEY (CompanyId) REFERENCES app.Companies(CompanyId),
    CONSTRAINT CK_Opportunities_WorkMode CHECK (WorkMode IS NULL OR WorkMode IN ('REMOTE','HYBRID','ONSITE')),
    CONSTRAINT CK_Opportunities_Dates CHECK (ClosingOn IS NULL OR PublishedOn IS NULL OR ClosingOn >= PublishedOn)
);
GO
CREATE INDEX IX_Opportunities_Owner_Created ON app.Opportunities(OwnerUserId, CreatedAtUtc DESC) INCLUDE (CompanyId, JobTitle, WorkMode) WHERE IsDeleted = 0;
GO

CREATE TABLE app.ApplicationStatuses (
    StatusId            SMALLINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ApplicationStatuses PRIMARY KEY,
    Code                VARCHAR(30) NOT NULL CONSTRAINT UQ_ApplicationStatuses_Code UNIQUE,
    DisplayName         NVARCHAR(80) NOT NULL,
    SortOrder           TINYINT NOT NULL,
    IsTerminal          BIT NOT NULL CONSTRAINT DF_ApplicationStatuses_IsTerminal DEFAULT (0),
    IsActive            BIT NOT NULL CONSTRAINT DF_ApplicationStatuses_IsActive DEFAULT (1)
);
GO

CREATE TABLE app.Applications (
    ApplicationId       BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Applications PRIMARY KEY,
    OwnerUserId         UNIQUEIDENTIFIER NOT NULL,
    OpportunityId       BIGINT NOT NULL,
    CurrentStatusId     SMALLINT NOT NULL,
    AppliedOn           DATE NULL,
    NextAction          NVARCHAR(250) NULL,
    NextActionAtUtc     DATETIME2(0) NULL,
    ClosedAtUtc         DATETIME2(0) NULL,
    IsDeleted           BIT NOT NULL CONSTRAINT DF_Applications_IsDeleted DEFAULT (0),
    CreatedAtUtc        DATETIME2(0) NOT NULL CONSTRAINT DF_Applications_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAtUtc        DATETIME2(0) NOT NULL CONSTRAINT DF_Applications_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    RowVersion          ROWVERSION NOT NULL,
    CONSTRAINT FK_Applications_Owner FOREIGN KEY (OwnerUserId) REFERENCES sec.Users(UserId),
    CONSTRAINT FK_Applications_Opportunity FOREIGN KEY (OpportunityId) REFERENCES app.Opportunities(OpportunityId),
    CONSTRAINT FK_Applications_Status FOREIGN KEY (CurrentStatusId) REFERENCES app.ApplicationStatuses(StatusId)
);
GO
CREATE UNIQUE INDEX UX_Applications_Owner_Opportunity ON app.Applications(OwnerUserId, OpportunityId) WHERE IsDeleted = 0;
CREATE INDEX IX_Applications_Owner_Status ON app.Applications(OwnerUserId, CurrentStatusId, UpdatedAtUtc DESC) INCLUDE (NextAction, NextActionAtUtc) WHERE IsDeleted = 0;
GO

CREATE TABLE app.ApplicationStatusHistory (
    HistoryId           BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ApplicationStatusHistory PRIMARY KEY,
    ApplicationId       BIGINT NOT NULL,
    PreviousStatusId    SMALLINT NULL,
    NewStatusId         SMALLINT NOT NULL,
    ChangedByUserId     UNIQUEIDENTIFIER NOT NULL,
    Comment             NVARCHAR(1000) NULL,
    ChangedAtUtc        DATETIME2(0) NOT NULL CONSTRAINT DF_StatusHistory_ChangedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_StatusHistory_Application FOREIGN KEY (ApplicationId) REFERENCES app.Applications(ApplicationId),
    CONSTRAINT FK_StatusHistory_Previous FOREIGN KEY (PreviousStatusId) REFERENCES app.ApplicationStatuses(StatusId),
    CONSTRAINT FK_StatusHistory_New FOREIGN KEY (NewStatusId) REFERENCES app.ApplicationStatuses(StatusId),
    CONSTRAINT FK_StatusHistory_User FOREIGN KEY (ChangedByUserId) REFERENCES sec.Users(UserId)
);
GO
CREATE INDEX IX_StatusHistory_Application_Date ON app.ApplicationStatusHistory(ApplicationId, ChangedAtUtc DESC) INCLUDE (PreviousStatusId, NewStatusId, ChangedByUserId);
GO

CREATE TABLE app.Documents (
    DocumentId          BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Documents PRIMARY KEY,
    OwnerUserId         UNIQUEIDENTIFIER NOT NULL,
    ApplicationId       BIGINT NULL,
    DocumentType        VARCHAR(30) NOT NULL,
    OriginalFileName    NVARCHAR(255) NOT NULL,
    StorageKey          NVARCHAR(500) NOT NULL,
    ContentType         NVARCHAR(120) NOT NULL,
    SizeBytes           BIGINT NOT NULL,
    Sha256              BINARY(32) NOT NULL,
    VersionNumber       SMALLINT NOT NULL CONSTRAINT DF_Documents_Version DEFAULT (1),
    IsDeleted           BIT NOT NULL CONSTRAINT DF_Documents_IsDeleted DEFAULT (0),
    CreatedAtUtc        DATETIME2(0) NOT NULL CONSTRAINT DF_Documents_CreatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_Documents_Owner FOREIGN KEY (OwnerUserId) REFERENCES sec.Users(UserId),
    CONSTRAINT FK_Documents_Application FOREIGN KEY (ApplicationId) REFERENCES app.Applications(ApplicationId),
    CONSTRAINT CK_Documents_Size CHECK (SizeBytes BETWEEN 1 AND 10485760)
);
GO
CREATE INDEX IX_Documents_Owner_Application ON app.Documents(OwnerUserId, ApplicationId, CreatedAtUtc DESC) WHERE IsDeleted = 0;
GO

CREATE TABLE app.Activities (
    ActivityId          BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Activities PRIMARY KEY,
    OwnerUserId         UNIQUEIDENTIFIER NOT NULL,
    ApplicationId       BIGINT NULL,
    Title               NVARCHAR(180) NOT NULL,
    ActivityType        VARCHAR(30) NOT NULL,
    DueAtUtc            DATETIME2(0) NOT NULL,
    CompletedAtUtc      DATETIME2(0) NULL,
    ReminderMinutes     INT NULL,
    Notes               NVARCHAR(1000) NULL,
    CreatedAtUtc        DATETIME2(0) NOT NULL CONSTRAINT DF_Activities_CreatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_Activities_Owner FOREIGN KEY (OwnerUserId) REFERENCES sec.Users(UserId),
    CONSTRAINT FK_Activities_Application FOREIGN KEY (ApplicationId) REFERENCES app.Applications(ApplicationId),
    CONSTRAINT CK_Activities_Reminder CHECK (ReminderMinutes IS NULL OR ReminderMinutes BETWEEN 0 AND 43200)
);
GO
CREATE INDEX IX_Activities_Owner_Due ON app.Activities(OwnerUserId, DueAtUtc) INCLUDE (Title, ActivityType, CompletedAtUtc);
GO

CREATE TABLE audit.AuditLog (
    AuditId             BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_AuditLog PRIMARY KEY,
    UserId              UNIQUEIDENTIFIER NULL,
    ActionCode          VARCHAR(60) NOT NULL,
    EntityType          VARCHAR(60) NOT NULL,
    EntityId            NVARCHAR(80) NULL,
    ResultCode          VARCHAR(20) NOT NULL,
    IpAddress           VARCHAR(45) NULL,
    CorrelationId       UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_AuditLog_Correlation DEFAULT (NEWID()),
    DetailsJson         NVARCHAR(MAX) NULL,
    CreatedAtUtc        DATETIME2(0) NOT NULL CONSTRAINT DF_AuditLog_CreatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_AuditLog_User FOREIGN KEY (UserId) REFERENCES sec.Users(UserId),
    CONSTRAINT CK_AuditLog_Json CHECK (DetailsJson IS NULL OR ISJSON(DetailsJson) = 1)
);
GO
CREATE INDEX IX_AuditLog_User_Date ON audit.AuditLog(UserId, CreatedAtUtc DESC) INCLUDE (ActionCode, EntityType, EntityId, ResultCode);
GO

INSERT INTO sec.Roles(Name, Description)
SELECT N'USER', N'Usuario que administra únicamente sus propios registros'
WHERE NOT EXISTS (SELECT 1 FROM sec.Roles WHERE Name = N'USER');

INSERT INTO sec.Roles(Name, Description)
SELECT N'ADMIN', N'Administrador con funciones de soporte y gestión de cuentas'
WHERE NOT EXISTS (SELECT 1 FROM sec.Roles WHERE Name = N'ADMIN');

INSERT INTO app.ApplicationStatuses(Code, DisplayName, SortOrder, IsTerminal)
SELECT V.Code, V.DisplayName, V.SortOrder, V.IsTerminal
FROM (VALUES
    ('REGISTERED', N'Registrada', 10, 0),
    ('SENT', N'Postulación enviada', 20, 0),
    ('PRESELECTED', N'Preselección', 30, 0),
    ('INTERVIEW', N'Entrevista', 40, 0),
    ('ASSESSMENT', N'Evaluación', 50, 0),
    ('OFFER', N'Oferta', 60, 0),
    ('HIRED', N'Contratación', 70, 1),
    ('REJECTED', N'Descartada', 80, 1),
    ('WITHDRAWN', N'Retirada', 90, 1)
) V(Code, DisplayName, SortOrder, IsTerminal)
WHERE NOT EXISTS (SELECT 1 FROM app.ApplicationStatuses S WHERE S.Code = V.Code);
GO

CREATE OR ALTER PROCEDURE app.ChangeApplicationStatus
    @ApplicationId      BIGINT,
    @OwnerUserId        UNIQUEIDENTIFIER,
    @NewStatusCode      VARCHAR(30),
    @Comment            NVARCHAR(1000) = NULL,
    @IpAddress          VARCHAR(45) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @OldStatusId SMALLINT, @NewStatusId SMALLINT;
    SELECT @NewStatusId = StatusId FROM app.ApplicationStatuses WHERE Code = @NewStatusCode AND IsActive = 1;
    IF @NewStatusId IS NULL THROW 50001, 'Estado no válido.', 1;

    BEGIN TRANSACTION;
    SELECT @OldStatusId = CurrentStatusId
    FROM app.Applications WITH (UPDLOCK, ROWLOCK)
    WHERE ApplicationId = @ApplicationId AND OwnerUserId = @OwnerUserId AND IsDeleted = 0;

    IF @OldStatusId IS NULL
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50002, 'Postulación no encontrada o acceso denegado.', 1;
    END;

    IF @OldStatusId = @NewStatusId
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50003, 'El nuevo estado debe ser diferente del actual.', 1;
    END;

    UPDATE app.Applications
    SET CurrentStatusId = @NewStatusId, UpdatedAtUtc = SYSUTCDATETIME()
    WHERE ApplicationId = @ApplicationId;

    INSERT INTO app.ApplicationStatusHistory(ApplicationId, PreviousStatusId, NewStatusId, ChangedByUserId, Comment)
    VALUES (@ApplicationId, @OldStatusId, @NewStatusId, @OwnerUserId, @Comment);

    INSERT INTO audit.AuditLog(UserId, ActionCode, EntityType, EntityId, ResultCode, IpAddress, DetailsJson)
    VALUES (@OwnerUserId, 'APPLICATION_STATUS_CHANGED', 'Application', CONVERT(NVARCHAR(80), @ApplicationId), 'SUCCESS', @IpAddress,
            JSON_OBJECT('previousStatusId': @OldStatusId, 'newStatusId': @NewStatusId));

    COMMIT TRANSACTION;
END;
GO

/* Usuario de aplicación sugerido (ejecutar con una contraseña administrada fuera del repositorio):

CREATE LOGIN PostulaTrackApp WITH PASSWORD = '<GENERAR_CONTRASENA_SEGURA>', CHECK_POLICY = ON;
CREATE USER PostulaTrackApp FOR LOGIN PostulaTrackApp;
GRANT SELECT, INSERT, UPDATE ON SCHEMA::app TO PostulaTrackApp;
GRANT EXECUTE ON OBJECT::app.ChangeApplicationStatus TO PostulaTrackApp;
DENY DELETE ON SCHEMA::app TO PostulaTrackApp;
GRANT SELECT, INSERT, UPDATE ON SCHEMA::sec TO PostulaTrackApp;
GRANT SELECT, INSERT ON SCHEMA::audit TO PostulaTrackApp;
DENY UPDATE, DELETE ON SCHEMA::audit TO PostulaTrackApp;

*/
