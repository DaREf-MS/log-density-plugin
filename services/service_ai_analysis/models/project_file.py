from pydantic import BaseModel, field_validator

class ProjectFile(BaseModel):
    url: str
    fileContent: str
    
    # Validate if field url is empty or not
    @field_validator('url')
    def check_url(cls, value):
        if not value.strip():
            # Status code 422 with relevant message
            raise ValueError('The URL to the GitHub repository must not be empty.')
        return value