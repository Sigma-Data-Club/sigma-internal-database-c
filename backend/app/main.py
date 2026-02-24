from fastapi import FastAPI
from app.routers.members import router as members_router
from app.routers.auth import router as auth_router

app = FastAPI()
app.include_router(members_router)
app.include_router(auth_router)

@app.get("/")
def read_root():
    return {"status": "ok"}


@app.get("/health")
def health():
    return {"status": "ok"}