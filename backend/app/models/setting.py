from app.database import Base
from sqlalchemy import Column, String

class SystemSetting(Base):
    __tablename__ = "system_settings"
    
    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)