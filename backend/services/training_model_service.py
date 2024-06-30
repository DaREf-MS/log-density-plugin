from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl
from git import Repo
import os
import subprocess


# Base directory for cloned projects
BASE_DIR = "/dossier_host"

async def create_model_service(project_url: str):
    github_url = project_url
    try:
        # Define the project name and directory
        project_name = github_url.split('/')[-1].replace('.git', '')

        # Create a subdirectory named after the project for the generated files
        output_dir = os.path.join(BASE_DIR, project_name + "_project")
        os.makedirs(output_dir, exist_ok=True)
        
        project_path = os.path.join(output_dir, project_name)
        
        # Clone the repo if it does not exist
        if not os.path.exists(project_path):
            Repo.clone_from(github_url, project_path)
        else:
            return {"message": "Repository already exists", "path": project_path}
        # Run preprocessing script
        preprocess_command = f"preprocess_project {project_path}"
        subprocess.run(preprocess_command, shell=True, check=True)
        
        # Run model script
        model_command = f"python3 /app/training/LSTM_Log_Density_Model.py {project_path}"
        subprocess.run(model_command, shell=True, check=True)
        return {"message": "AI model created successfully", "path": project_path}
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Script execution failed: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
