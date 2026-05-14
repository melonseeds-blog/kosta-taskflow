from sqlalchemy import Column, Integer, String, DateTime, Date, Text
from datetime import datetime
from database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    memo = Column(Text, nullable=True)
    # 상태: todo | in_progress | done
    status = Column(String, default="todo")
    # 우선순위: low | medium | high
    priority = Column(String, default="medium")
    start_date = Column(Date, nullable=True)
    due_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
