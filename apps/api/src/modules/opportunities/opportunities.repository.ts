import type { OpportunityInput } from "@postulatrack/contracts"
import { getPool, sql } from "../../database/pool.js"

export async function listOpportunities(userId: string) {
  const pool = await getPool()
  const result = await pool.request().input("UserId", sql.UniqueIdentifier, userId).query(`
    SELECT o.OpportunityId, o.JobTitle, o.SourceName, o.SourceUrl, o.WorkMode, o.Location,
           o.PublishedOn, o.ClosingOn, o.Notes, o.CreatedAtUtc, c.CompanyId, c.Name AS CompanyName,
           a.ApplicationId, s.Code AS ApplicationStatusCode, s.DisplayName AS ApplicationStatus
    FROM app.Opportunities o
    JOIN app.Companies c ON c.CompanyId = o.CompanyId AND c.OwnerUserId = @UserId
    LEFT JOIN app.Applications a ON a.OpportunityId = o.OpportunityId AND a.OwnerUserId = @UserId AND a.IsDeleted = 0
    LEFT JOIN app.ApplicationStatuses s ON s.StatusId = a.CurrentStatusId
    WHERE o.OwnerUserId = @UserId AND o.IsDeleted = 0
    ORDER BY o.CreatedAtUtc DESC;
  `)
  return result.recordset
}

export async function createOpportunity(userId: string, input: OpportunityInput) {
  const pool = await getPool()
  const transaction = new sql.Transaction(pool)
  await transaction.begin()
  try {
    const companyResult = await new sql.Request(transaction)
      .input("UserId", sql.UniqueIdentifier, userId)
      .input("Name", sql.NVarChar(180), input.companyName)
      .input("Sector", sql.NVarChar(120), input.sector ?? null)
      .query(`
        DECLARE @CompanyId BIGINT = (SELECT CompanyId FROM app.Companies WITH (UPDLOCK, HOLDLOCK)
          WHERE OwnerUserId=@UserId AND Name=@Name AND IsDeleted=0);
        IF @CompanyId IS NULL
        BEGIN
          INSERT INTO app.Companies(OwnerUserId, Name, Sector) VALUES(@UserId, @Name, @Sector);
          SET @CompanyId = SCOPE_IDENTITY();
        END
        SELECT @CompanyId AS CompanyId;
      `)
    const companyId = companyResult.recordset[0].CompanyId

    const opportunityResult = await new sql.Request(transaction)
      .input("UserId", sql.UniqueIdentifier, userId)
      .input("CompanyId", sql.BigInt, companyId)
      .input("JobTitle", sql.NVarChar(180), input.jobTitle)
      .input("SourceName", sql.NVarChar(100), input.sourceName ?? null)
      .input("SourceUrl", sql.NVarChar(1000), input.sourceUrl || null)
      .input("WorkMode", sql.VarChar(20), input.workMode ?? null)
      .input("Location", sql.NVarChar(180), input.location ?? null)
      .input("PublishedOn", sql.Date, input.publishedOn ?? null)
      .input("ClosingOn", sql.Date, input.closingOn ?? null)
      .input("Notes", sql.NVarChar(2000), input.notes ?? null)
      .query(`
        INSERT INTO app.Opportunities(OwnerUserId, CompanyId, JobTitle, SourceName, SourceUrl, WorkMode, Location, PublishedOn, ClosingOn, Notes)
        OUTPUT inserted.OpportunityId
        VALUES(@UserId, @CompanyId, @JobTitle, @SourceName, @SourceUrl, @WorkMode, @Location, @PublishedOn, @ClosingOn, @Notes);
      `)
    const opportunityId = opportunityResult.recordset[0].OpportunityId
    let applicationId: number | null = null

    if (input.createApplication) {
      const application = await new sql.Request(transaction)
        .input("UserId", sql.UniqueIdentifier, userId)
        .input("OpportunityId", sql.BigInt, opportunityId)
        .query(`
          DECLARE @StatusId SMALLINT = (SELECT StatusId FROM app.ApplicationStatuses WHERE Code='REGISTERED');
          INSERT INTO app.Applications(OwnerUserId, OpportunityId, CurrentStatusId)
          OUTPUT inserted.ApplicationId
          VALUES(@UserId, @OpportunityId, @StatusId);
        `)
      applicationId = application.recordset[0].ApplicationId
      await new sql.Request(transaction)
        .input("UserId", sql.UniqueIdentifier, userId)
        .input("ApplicationId", sql.BigInt, applicationId)
        .query(`
          INSERT INTO app.ApplicationStatusHistory(ApplicationId, PreviousStatusId, NewStatusId, ChangedByUserId, Comment)
          SELECT @ApplicationId, NULL, StatusId, @UserId, N'Proceso creado desde una oportunidad.'
          FROM app.ApplicationStatuses WHERE Code='REGISTERED';
        `)
    }

    await new sql.Request(transaction)
      .input("UserId", sql.UniqueIdentifier, userId)
      .input("OpportunityId", sql.NVarChar(80), String(opportunityId))
      .query(`INSERT INTO audit.AuditLog(UserId, ActionCode, EntityType, EntityId, ResultCode)
              VALUES(@UserId, 'OPPORTUNITY_CREATED', 'Opportunity', @OpportunityId, 'SUCCESS');`)
    if (applicationId !== null) {
      await new sql.Request(transaction)
        .input("UserId", sql.UniqueIdentifier, userId)
        .input("ApplicationId", sql.NVarChar(80), String(applicationId))
        .query(`INSERT INTO audit.AuditLog(UserId, ActionCode, EntityType, EntityId, ResultCode)
                VALUES(@UserId, 'APPLICATION_CREATED', 'Application', @ApplicationId, 'SUCCESS');`)
    }

    await transaction.commit()
    return { opportunityId: Number(opportunityId), applicationId: applicationId ? Number(applicationId) : null }
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

export async function deleteOpportunity(userId: string, opportunityId: number) {
  const pool = await getPool()
  const result = await pool.request()
    .input("UserId", sql.UniqueIdentifier, userId)
    .input("OpportunityId", sql.BigInt, opportunityId)
    .query(`SET XACT_ABORT ON;
            BEGIN TRY
              BEGIN TRANSACTION;
              UPDATE app.Opportunities SET IsDeleted=1, UpdatedAtUtc=SYSUTCDATETIME()
              WHERE OpportunityId=@OpportunityId AND OwnerUserId=@UserId AND IsDeleted=0;
              DECLARE @Affected INT = @@ROWCOUNT;
              IF @Affected=1
                INSERT INTO audit.AuditLog(UserId, ActionCode, EntityType, EntityId, ResultCode)
                VALUES(@UserId, 'OPPORTUNITY_ARCHIVED', 'Opportunity', CONVERT(NVARCHAR(80), @OpportunityId), 'SUCCESS');
              COMMIT TRANSACTION;
              SELECT @Affected AS Affected;
            END TRY
            BEGIN CATCH
              IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
              THROW;
            END CATCH;`)
  return result.recordset[0].Affected > 0
}
