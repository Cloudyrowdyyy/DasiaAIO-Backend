# PowerShell script to seed the database
$env:PGPASSWORD = "kXgebinlNjUyAMwhaQFUpihblOZYqrIw"
$env:PGSSLMODE = "prefer"

$psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$dbHost = "dpg-cu2d64hu0jms73836gog-a.oregon-postgres.render.com"
$port = "5432"
$dbname = "railway"
$user = "postgres"
$sqlFile = "seed_dashboard.sql"

# Execute
& $psqlPath -h $dbHost -p $port -d $dbname -U $user -f $sqlFile

Write-Host "Seeding completed!"
