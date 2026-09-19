import { Router } from "express"
import { getPool, sql } from "../../database/pool.js"
import { authenticate } from "../../middleware/security.js"
import { asyncHandler } from "../../shared/http.js"

export const dashboardRouter = Router()
dashboardRouter.use(authenticate)

dashboardRouter.get("/", asyncHandler(async (req, res) => {
  const pool = await getPool()
  const result = await pool.request().input("UserId", sql.UniqueIdentifier, req.user!.userId).query(`
    SELECT
      COUNT_BIG(*) AS ActiveProcesses,
      SUM(CASE WHEN s.Code='INTERVIEW' THEN 1 ELSE 0 END) AS Interviews,
      SUM(CASE WHEN a.NextActionAtUtc IS NOT NULL AND a.NextActionAtUtc < DATEADD(DAY, 1, SYSUTCDATETIME()) THEN 1 ELSE 0 END) AS PendingActions,
      SUM(CASE WHEN s.SortOrder >= 40 THEN 1 ELSE 0 END) AS AdvancedProcesses
    FROM app.Applications a
    JOIN app.ApplicationStatuses s ON s.StatusId=a.CurrentStatusId
    WHERE a.OwnerUserId=@UserId AND a.IsDeleted=0 AND s.IsTerminal=0;

    SELECT TOP 5 a.ApplicationId, o.JobTitle, c.Name AS CompanyName, s.DisplayName AS StatusName, a.UpdatedAtUtc
    FROM app.Applications a
    JOIN app.ApplicationStatuses s ON s.StatusId=a.CurrentStatusId
    JOIN app.Opportunities o ON o.OpportunityId=a.OpportunityId
    JOIN app.Companies c ON c.CompanyId=o.CompanyId
    WHERE a.OwnerUserId=@UserId AND a.IsDeleted=0
    ORDER BY a.UpdatedAtUtc DESC;

    SELECT TOP 5 ActivityId, Title, ActivityType, DueAtUtc, CompletedAtUtc
    FROM app.Activities
    WHERE OwnerUserId=@UserId AND CompletedAtUtc IS NULL AND DueAtUtc >= DATEADD(DAY,-1,SYSUTCDATETIME())
    ORDER BY DueAtUtc;
  `)
  const sets = result.recordsets as unknown as Array<Array<Record<string, any>>>
  const metrics = sets[0]?.[0] ?? { ActiveProcesses: 0, Interviews: 0, PendingActions: 0, AdvancedProcesses: 0 }
  const active = Number(metrics.ActiveProcesses || 0)
  res.json({
    metrics: {
      activeProcesses: active,
      interviews: Number(metrics.Interviews || 0),
      pendingActions: Number(metrics.PendingActions || 0),
      progressRate: active ? Math.round(Number(metrics.AdvancedProcesses || 0) * 100 / active) : 0,
    },
    recent: sets[1] ?? [],
    upcoming: sets[2] ?? [],
  })
}))
