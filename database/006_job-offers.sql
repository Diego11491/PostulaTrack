USE [PostulaTrack];
GO

IF OBJECT_ID(N'app.JobOffers', N'U') IS NULL
BEGIN
    CREATE TABLE app.JobOffers (
        JobOfferId BIGINT IDENTITY(1,1) NOT NULL,
        JobTitle NVARCHAR(180) NOT NULL,
        CompanyName NVARCHAR(180) NOT NULL,
        Sector NVARCHAR(120) NULL,
        Location NVARCHAR(180) NULL,
        WorkMode VARCHAR(20) NULL,
        RequirementsSummary NVARCHAR(2000) NOT NULL,
        SourceName NVARCHAR(100) NOT NULL,
        SourceUrl NVARCHAR(1000) NOT NULL,
        PublishedOn DATE NULL,
        ClosingOn DATE NULL,
        IsActive BIT NOT NULL
            CONSTRAINT DF_JobOffers_IsActive DEFAULT (1),
        CreatedByUserId UNIQUEIDENTIFIER NOT NULL,
        CreatedAtUtc DATETIME2(0) NOT NULL
            CONSTRAINT DF_JobOffers_CreatedAtUtc
            DEFAULT (SYSUTCDATETIME()),
        UpdatedAtUtc DATETIME2(0) NOT NULL
            CONSTRAINT DF_JobOffers_UpdatedAtUtc
            DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_JobOffers
            PRIMARY KEY (JobOfferId),

        CONSTRAINT FK_JobOffers_CreatedByUser
            FOREIGN KEY (CreatedByUserId)
            REFERENCES sec.Users(UserId),

        CONSTRAINT CK_JobOffers_WorkMode
            CHECK (
                WorkMode IS NULL
                OR WorkMode IN ('HYBRID', 'REMOTE', 'ONSITE')
            ),

        CONSTRAINT CK_JobOffers_Dates
            CHECK (
                PublishedOn IS NULL
                OR ClosingOn IS NULL
                OR ClosingOn >= PublishedOn
            )
    );

    PRINT N'Tabla de ofertas creada correctamente.';
END
ELSE
BEGIN
    PRINT N'La tabla de ofertas ya existe.';
END;
GO