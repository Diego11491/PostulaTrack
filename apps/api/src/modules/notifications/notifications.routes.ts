import { Router } from "express"
import { query } from "../../database/pool.js"
import { authenticate, requireCandidate } from "../../middleware/security.js"
import { asyncHandler } from "../../shared/http.js"

export const notificationsRouter = Router()
notificationsRouter.use(authenticate,requireCandidate)

// Avisos calculados a partir de registros privados; no se inventan actividades ni se
// confunde el número de pendientes con un contador de mensajes sin leer.
notificationsRouter.get("/", asyncHandler(async (req, res) => {
  const rows = await query(`WITH notices AS (
      SELECT ('action-' || a.applicationid)::text AS id, 'ACTION'::text AS kind,
        a.nextaction AS title, c.name AS detail, a.nextactionatutc AS due,
        ('/postulaciones/' || a.applicationid)::text AS href
      FROM app.applications a
      JOIN app.applicationstatuses s ON s.statusid=a.currentstatusid
      JOIN app.opportunities o ON o.opportunityid=a.opportunityid AND o.owneruserid=$1 AND NOT o.isdeleted
      JOIN app.companies c ON c.companyid=o.companyid AND c.owneruserid=$1
      WHERE a.owneruserid=$1 AND NOT a.isdeleted AND NOT s.isterminal
        AND a.nextaction IS NOT NULL AND a.nextactionatutc IS NOT NULL
        AND a.nextactionatutc<=now()+interval '7 days'
      UNION ALL
      SELECT ('deadline-' || o.opportunityid)::text, 'DEADLINE'::text,
        o.jobtitle, c.name,
        (o.closingon::timestamp + interval '23 hours 59 minutes') AT TIME ZONE 'America/Lima',
        '/oportunidades'::text
      FROM app.opportunities o
      JOIN app.companies c ON c.companyid=o.companyid AND c.owneruserid=$1
      WHERE o.owneruserid=$1 AND NOT o.isdeleted
        AND o.closingon BETWEEN (now() AT TIME ZONE 'America/Lima')::date
          AND (now() AT TIME ZONE 'America/Lima')::date+7
    )
    SELECT id AS "Id",kind AS "Kind",title AS "Title",detail AS "Detail",
      due AS "DueAtUtc",href AS "Href",count(*) OVER ()::int AS "Total"
    FROM notices
    ORDER BY (due<now()) DESC,
      CASE WHEN due<now() THEN due END DESC,
      CASE WHEN due>=now() THEN due END ASC
    LIMIT 8`, [req.user!.userId])
  res.json({ total: rows[0]?.Total ?? 0, notifications: rows.map(({ Total: _total, ...item }) => item) })
}))
