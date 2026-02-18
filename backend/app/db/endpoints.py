from fastapi import FastAPI

app = FastAPI(title="API")

# ---------- Academic Programs ----------
@app.get("/academic-programs")
def get_academic_programs():
    return {"status": "ok"}

@app.get("/academic-programs/{academicProgramId}")
def get_academic_program(academicProgramId: int):
    return {"status": "ok"}

@app.post("/academic-programs")
def create_academic_program():
    return {"status": "created"}

@app.put("/academic-programs/{academicProgramId}")
def update_academic_program(academicProgramId: int):
    return {"status": "updated"}

@app.delete("/academic-programs/{academicProgramId}")
def delete_academic_program(academicProgramId: int):
    return {"status": "deleted"}

