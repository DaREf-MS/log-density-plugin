from fastapi import HTTPException
from git import Repo
import os
import subprocess
import logging
import run_model

BASE_DIR = "/dossier_host"

async def predict(github_url: str, filepath: str):
    
    project_name = github_url.split('/')[-1].replace('.git', '')

    output_dir = os.path.join(BASE_DIR, project_name + "_project")
     
    project_path = os.path.join(output_dir, project_name)   
    filepath = os.path.join(output_dir,filepath)

    print("project path: ",project_path)
    print("file path: ",filepath)

    return run_model.predict(project_path,filepath)
