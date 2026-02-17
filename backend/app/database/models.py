from sqlalchemy import Column, Integer, String, Text
from app.database.database import Base

class Entity(Base):
    __tablename__ = "entities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, unique=True)
    type = Column(String)  # Demon, Angel, Spirit, Principality
    influence = Column(String) # Anger, Lust, Greed, etc.
    description = Column(Text)
    biblical_reference = Column(String, nullable=True)
    countermeasures = Column(Text, nullable=True) # JSON string or text description of rituals
    
    # Attribution
    source = Column(String, default="Unknown") # Book, URL, or Oral Tradition
    contributor = Column(String, default="System") # Username/Codename
