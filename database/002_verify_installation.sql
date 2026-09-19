USE PostulaTrack;
GO

SELECT DB_NAME() AS DatabaseName, @@VERSION AS SqlServerVersion;

SELECT s.name AS SchemaName, t.name AS TableName
FROM sys.tables t
JOIN sys.schemas s ON s.schema_id = t.schema_id
WHERE s.name IN ('sec', 'app', 'audit')
ORDER BY s.name, t.name;

SELECT Name AS RoleName, IsActive FROM sec.Roles ORDER BY RoleId;
SELECT Code, DisplayName, SortOrder, IsTerminal FROM app.ApplicationStatuses ORDER BY SortOrder;
GO
