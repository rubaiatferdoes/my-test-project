# Trial setup — getting the sample app running

One-time setup for the framework trial. Everything is local; nothing
here touches a shared environment.

```
D:\project\qa-trial\
├── framework\     ← you are here; run `claude` from this folder
└── sample-app\    ← the JHipster sample app (cloned, do not edit)
```

## 1. Install the two missing tools

Run these yourself — they need elevation:

```powershell
winget install EclipseAdoptium.Temurin.21.JDK --accept-package-agreements --accept-source-agreements
winget install PostgreSQL.PostgreSQL.17 --accept-package-agreements --accept-source-agreements
```

Then **open a new terminal** so `JAVA_HOME` and `psql` are on the path,
and check:

```powershell
java -version      # 21.x
psql --version     # 17.x
```

Maven is not needed — the sample app ships `mvnw`.

## 2. Create the database and the two users

The Postgres installer asks for a `postgres` superuser password. Using it:

```powershell
psql -U postgres -c "CREATE DATABASE \"jhipsterSampleApplication\";"
psql -U postgres -c "CREATE USER jhipster WITH PASSWORD 'jhipster';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE \"jhipsterSampleApplication\" TO jhipster;"
psql -U postgres -d jhipsterSampleApplication -c "GRANT ALL ON SCHEMA public TO jhipster;"
```

Then the **read-only** user the framework uses. This is the one that
matters — it is the same grant we will ask DevOps for on the real
product:

```powershell
psql -U postgres -c "CREATE USER qa_readonly WITH PASSWORD 'qa_readonly';"
psql -U postgres -d jhipsterSampleApplication -c "GRANT CONNECT ON DATABASE \"jhipsterSampleApplication\" TO qa_readonly;"
psql -U postgres -d jhipsterSampleApplication -c "GRANT USAGE ON SCHEMA public TO qa_readonly;"
psql -U postgres -d jhipsterSampleApplication -c "GRANT SELECT ON ALL TABLES IN SCHEMA public TO qa_readonly;"
psql -U postgres -d jhipsterSampleApplication -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO qa_readonly;"
```

The last line matters: Liquibase creates the tables when the app first
starts, **after** these grants run. Without `ALTER DEFAULT PRIVILEGES`
the read-only user would see nothing.

## 3. Point the sample app at Postgres

Its dev profile uses in-memory H2, which only one process can open — so
the read-only user could never connect. Two edits in `../sample-app`:

**a. Move the Postgres driver out of the `prod` profile.** In `pom.xml`,
add it to the main `<dependencies>` block:

```xml
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
</dependency>
```

**b. Point the dev datasource at it.** In
`src/main/resources/config/application-dev.yml`, replace the H2 url:

```yaml
datasource:
  url: jdbc:postgresql://localhost:5432/jhipsterSampleApplication
  username: jhipster
  password: jhipster
```

These are the only edits to the sample app outside the deliberate
experiments in CLAUDE.md section 13. Note them in `docs/trial/`.

## 4. Run it

```powershell
cd ..\sample-app
.\mvnw            # backend + Liquibase; first run downloads a lot
```

In a second terminal:

```powershell
cd ..\sample-app
.\npmw start      # Angular dev server
```

The backend is on **8080**, the Angular dev server on **4200** with a
proxy to the API. For discovery we want one origin, so either:

- use `http://localhost:4200` and set `TEST_ENV_BASE_URL` to it, or
- build the frontend into the backend once (`.\mvnw -Pprod -DskipTests`)
  and use `http://localhost:8080` for both.

The second is tidier for a walk. Sign in as `admin` / `admin`.

## 5. Fill in `.env`

```powershell
cd ..\framework
copy .env.example .env
```

Set `DB_READONLY_PASSWORD`, and `TEST_ENV_BASE_URL` to whichever origin
you chose above.

## 6. Check the wiring, then start

```powershell
python scripts\verify-setup.py
claude
```

Then, inside Claude Code:

```
/setup:env-readiness
```

Fix whatever it names, and only then run `/discovery:explore-app`.

## What to expect on the first walk

Findings, not a clean sheet. The sample app is ordinary open-source
software with ordinary gaps. A discovery run that reports nothing means
the walk was shallow — see CLAUDE.md section 13 for what we are actually
measuring.
