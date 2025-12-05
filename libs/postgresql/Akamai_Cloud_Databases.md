# [Akamai Cloud Databases](https://cloud.linode.com/databases)

## Connection Details
Username: akmadmin
Password: somePass123!
Database name: defaultdb
Host: abc.akamaidb.net
Read-only Host: replica.abc.akamaidb.net
Port: 20801
SSL: ENABLED
Connection Type: Public

```bash
psql --host=abc.akamaidb.net --port=20801 --username=akmadmin --password --dbname=defaultdb
```

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/{DB_NAME}
DATABASE_URL=postgres://akmadmin:somePass123!@abc.akamaidb.net:20801/defaultdb?sslmode=no-verify
```