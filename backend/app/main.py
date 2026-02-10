from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"status": "ok"}


@app.get("/health")
def health():
    return {"status": "ok"}