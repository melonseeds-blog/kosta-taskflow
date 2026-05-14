from pydantic import BaseModel
from datetime import datetime, date
from typing import Literal, Optional

class TaskCreate(BaseModel):
    title: str
    memo: Optional[str] = None
    priority: Literal["low", "medium", "high"] = "medium"
    start_date: Optional[date] = None
    due_date: Optional[date] = None

class TaskUpdate(BaseModel):
    status: Optional[Literal["todo", "in_progress", "done"]] = None
    priority: Optional[Literal["low", "medium", "high"]] = None
    memo: Optional[str] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None

class TaskResponse(BaseModel):
    id: int
    title: str
    memo: Optional[str]
    status: str
    priority: str
    start_date: Optional[date]
    due_date: Optional[date]
    created_at: datetime

    class Config:
        from_attributes = True
