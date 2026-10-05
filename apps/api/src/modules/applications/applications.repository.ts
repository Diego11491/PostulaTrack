import type { ApplicationInput, StatusChangeInput } from "@postulatrack/contracts"
import { getPool, sql } from "../../database/pool.js"
import { AppError } from "../../shared/http.js"

export async function listApplications(userId: string) {
  const pool = await getPool()
  const result = await pool.request().input("UserId", sql.UniqueIdentifier, userId).query(`
    SELECT a.ApplicationId, a.AppliedOn, a.NextAction, a.NextActionAtUtc, a.UpdatedAtUtc,
           s.Code AS StatusCode, s.DisplayName AS StatusName, s.SortOrder,
           o.OpportunityId, o.JobTitle, o.WorkMode, o.Location, c.Name AS CompanyName
    FROM app.Applications a
    JOIN app.ApplicationStatuses s ON s.StatusId=a.CurrentStatusId
    JOIN app.Opportunities o ON o.OpportunityId=a.OpportunityId AND o.OwnerUserId=@UserId
    JOIN app.Companies c ON c.CompanyId=o.CompanyId AND c.OwnerUserId=@UserId
    WHERE a.OwnerUserId=@UserId AND a.IsDeleted=0
    ORDER BY s.SortOrder, a.UpdatedAtUtc DESC;
  `)
  return result.recordset
}

export async function getApplication(userId: string, applicationId: number) {
  const pool = await getPool()
  const request = pool.request().input("UserId", sql.UniqueIdentifier, userId).input("ApplicationId", sql.BigInt, applicationId)
  const result = await request.query(`
    SELECT a.ApplicationId, a.AppliedOn, a.NextAction, a.NextActionAtUtc, a.UpdatedAtUtc,
           s.Code AS StatusCode, s.DisplayName AS StatusName,
           o.OpportunityId, o.JobTitle, o.SourceName, o.SourceUrl, o.WorkMode, o.Location, o.Notes,
           c.CompanyId, c.Name AS CompanyName, c.Sector
    FROM app.Applications a
    JOIN app.ApplicationStatuses s ON s.StatusId=a.CurrentStatusId
    JOIN app.Opportunities o ON o.OpportunityId=a.OpportunityId AND o.OwnerUserId=@UserId
    JOIN app.Companies c ON c.CompanyId=o.CompanyId AND c.OwnerUserId=@UserId
    WHERE a.ApplicationId=@ApplicationId AND a.OwnerUserId=@UserId AND a.IsDeleted=0;

    SELECT h.HistoryId, prev.DisplayName AS PreviousStatus, current.DisplayName AS NewStatus,
           h.Comment, h.ChangedAtUtc, p.FirstName, p.LastName
    FROM app.ApplicationStatusHistory h
    LEFT JOIN app.ApplicationStatuses prev ON prev.StatusId=h.PreviousStatusId
    JOIN app.ApplicationStatuses current ON current.StatusId=h.NewStatusId
    JOIN app.Profiles p ON p.UserId=h.ChangedByUserId
    JOIN app.Applications a ON a.ApplicationId=h.ApplicationId AND a.OwnerUserId=@UserId
    WHERE h.ApplicationId=@ApplicationId
    ORDER BY h.HistoryId DESC;
  `)
  const sets = result.recordsets as unknown as Array<Array<Record<string, unknown>>>
  if (!sets[0]?.length) return null
  return { application: sets[0][0], history: sets[1] ?? [] }
}

export async function createApplication(userId: string, input: ApplicationInput) {
  const pool = await getPool()
  const transaction = new sql.Transaction(pool)
  await transaction.begin()
  try {
    const owner = await new sql.Request(transaction)
      .input("UserId", sql.UniqueIdentifier, userId)
      .input("OpportunityId", sql.BigInt, input.opportunityId)
      .query("SELECT 1 AS Owned FROM app.Opportunities WHERE OpportunityId=@OpportunityId AND OwnerUserId=@UserId AND IsDeleted=0;")
    if (!owner.recordset.length) throw new AppError(404, "OPPORTUNITY_NOT_FOUND", "No se encontró la oportunidad.")
    const inserted = await new sql.Request(transaction)
      .input("UserId", sql.UniqueIdentifier, userId)
      .input("OpportunityId", sql.BigInt, input.opportunityId)
      .input("AppliedOn", sql.Date, input.appliedOn ?? null)
      .input("NextAction", sql.NVarChar(250), input.nextAction ?? null)
      .input("NextActionAtUtc", sql.DateTime2(0), input.nextActionAtUtc ? new Date(input.nextActionAtUtc) : null)
      .query(`
        DECLARE @StatusId SMALLINT=(SELECT StatusId FROM app.ApplicationStatuses WHERE Code='REGISTERED');
        INSERT INTO app.Applications(OwnerUserId, OpportunityId, CurrentStatusId, AppliedOn, NextAction, NextActionAtUtc)
        OUTPUT inserted.ApplicationId
        VALUES(@UserId, @OpportunityId, @StatusId, @AppliedOn, @NextAction, @NextActionAtUtc);
      `)
    const applicationId = inserted.recordset[0].ApplicationId
    await new sql.Request(transaction).input("UserId", sql.UniqueIdentifier, userId).input("ApplicationId", sql.BigInt, applicationId).query(`
      INSERT INTO app.ApplicationStatusHistory(ApplicationId, PreviousStatusId, NewStatusId, ChangedByUserId, Comment)
      SELECT @ApplicationId, NULL, StatusId, @UserId, N'Proceso creado.' FROM app.ApplicationStatuses WHERE Code='REGISTERED';
    `)
    await new sql.Request(transaction)
      .input("UserId", sql.UniqueIdentifier, userId)
      .input("ApplicationId", sql.NVarChar(80), String(applicationId))
      .query(`INSERT INTO audit.AuditLog(UserId, ActionCode, EntityType, EntityId, ResultCode)
              VALUES(@UserId, 'APPLICATION_CREATED', 'Application', @ApplicationId, 'SUCCESS');`)
    await transaction.commit()
    return Number(applicationId)
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

export async function changeStatus(userId: string, applicationId: number, input: StatusChangeInput, ip: string | null) {
  const pool = await getPool()
  await pool.request()
    .input("ApplicationId", sql.BigInt, applicationId)
    .input("OwnerUserId", sql.UniqueIdentifier, userId)
    .input("NewStatusCode", sql.VarChar(30), input.newStatusCode)
    .input("Comment", sql.NVarChar(1000), input.comment ?? null)
    .input("IpAddress", sql.VarChar(45), ip)
    .execute("app.ChangeApplicationStatus")
}
