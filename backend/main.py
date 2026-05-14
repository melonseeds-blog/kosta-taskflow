from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/tasks", response_model=List[schemas.TaskResponse])
def get_tasks(db: Session = Depends(get_db)):
    return db.query(models.Task).order_by(models.Task.created_at.desc()).all()

@app.post("/api/tasks", response_model=schemas.TaskResponse, status_code=201)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    new_task = models.Task(
        title=task.title,
        memo=task.memo,
        priority=task.priority,
        start_date=task.start_date,
        due_date=task.due_date,
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@app.post("/api/tasks/import", response_model=List[schemas.TaskResponse], status_code=201)
def import_tasks(tasks: List[schemas.TaskCreate], db: Session = Depends(get_db)):
    created = []
    for task in tasks:
        new_task = models.Task(
            title=task.title,
            memo=task.memo,
            priority=task.priority,
            start_date=task.start_date,
            due_date=task.due_date,
        )
        db.add(new_task)
        db.flush()
        created.append(new_task)
    db.commit()
    for t in created:
        db.refresh(t)
    return created

@app.patch("/api/tasks/{task_id}", response_model=schemas.TaskResponse)
def update_task(task_id: int, body: schemas.TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="업무를 찾을 수 없습니다.")
    if body.status is not None:
        task.status = body.status
    if body.priority is not None:
        task.priority = body.priority
    if body.memo is not None:
        task.memo = body.memo
    if body.start_date is not None:
        task.start_date = body.start_date
    if body.due_date is not None:
        task.due_date = body.due_date
    db.commit()
    db.refresh(task)
    return task

@app.delete("/api/tasks/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="업무를 찾을 수 없습니다.")
    db.delete(task)
    db.commit()
