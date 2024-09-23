from pydantic import BaseModel, field_validator
from typing import List

class FileContent(BaseModel):
    url: str
    content: str

class ProjectAnalysis(BaseModel):
    gitUrl: str
    files: List[FileContent]

