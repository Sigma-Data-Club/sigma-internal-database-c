Backend Setup & Development Guide
Overview

This project uses:

1) FastAPI

2) PostgreSQL (Docker)

3) Alembic (database migrations)

4) uv (dependency management + virtual environment)

5) Docker + Docker Compose (development environment)

The goal is to ensure all developers run the same environment and avoid “works on my machine” problems.

Prerequisites

1) Install:

        Docker Desktop (latest recommended)

        Git

        (Optional) Python 3.12 locally if you want host development tools

2) Check Docker:

        docker --version
        docker compose version

        Project Architecture Notes
        Virtual Environments

Important rules:

1) .venv is local only

        .venv is ignored by Git (is in .gitignore)

        .venv is ignored by Docker build (is in .dockerignore)

2) Container dependencies are installed separately using uv

3) Never copy .venv into Docker.

First-Time Setup

1) Clone repository

git clone <repo>
cd <repo>

2) Create environment file

Create .env in project root:

Example of what should be in .env:

DATABASE_URL=postgresql+psycopg://club:clubpass@db:5432/clubdb


Important:

db = Docker Postgres service hostname

Do NOT use localhost inside Docker

3) Build Docker images

Write in the terminal of the project root folder:
    docker compose build

Clean rebuild if needed:

    docker compose build --no-cache

4) Start database
Write in the terminal of the project root folder:
    docker compose up -d db


Wait until it shows that it is healthy (errors or unhealthy status otherwise):

    docker compose ps

5) Run migrations
docker compose run --rm migrate

6) Start API

docker compose up -d api

Check logs:
    docker compose logs -f api


Swagger (the website to check):

http://localhost:8000/docs

Daily Development Workflow (Important!)

Typical startup:

    docker compose up -d db
    docker compose run --rm migrate
    docker compose up -d api

Making Database Changes
1) Modify DB using SQLAlchemy models or pg Admin 4 etc
2) Generate migration
    docker compose run --rm api uv run alembic revision --autogenerate -m "description"

3) Apply migration
docker compose run --rm migrate

Dependency Management (uv)

Add dependency:

    cd backend
    uv add package-name


Sync environment:

    uv sync


Commit BOTH:

    pyproject.toml
    uv.lock

Docker Development Rules
DO

    ✔ Use docker-compose for running services
    ✔ Use migrate service for DB schema updates
    ✔ Keep .env local
    ✔ Commit uv.lock

DO NOT

    ❌ Commit .env
    ❌ Commit .venv
    ❌ Install dependencies inside running containers manually
    ❌ Change database schema without migration

Troubleshooting
    Validate compose config
    docker compose config

View logs
    docker compose logs -f db
    docker compose logs -f api

Reset everything (including DB)

⚠ Deletes local database

    docker compose down -v
    docker compose build
    docker compose up -d db
    docker compose run --rm migrate
    docker compose up -d api

Important Project-Specific Notes
Host vs Container Database Access

From host:

    localhost:5433


From containers:

    db:5432

Why We Use Separate migrate Service

    Ensures migrations run in Docker environment

    Prevents accidental schema changes on startup

    Makes CI/CD safer

    Makes migration execution explicit

File Responsibilities

    docker-compose.yml → infrastructure
    Dockerfile → build environment
    pyproject.toml → dependencies
    uv.lock → dependency lock
    .env → local secrets/config

If Something Breaks

Try:

    docker compose down -v
    docker compose build --no-cache
    docker compose up -d db
    docker compose run --rm migrate
    docker compose up -d api

Questions / Team Conventions

If unsure:

    Ask before modifying database models

    Always create migrations

    Always test migrations locally