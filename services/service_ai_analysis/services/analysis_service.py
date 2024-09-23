from fastapi import HTTPException
from git import Repo
import os
import subprocess
import logging
from service_ai_analysis.run_model import predict
import tempfile

BASE_DIR = "/dossier_host"

async def predict_file_densities(github_url: str, fileContent: str):
    
    project_name = github_url.split('/')[-1].replace('.git', '')
    output_dir = os.path.join(BASE_DIR, project_name + "_project")
    project_path = os.path.join(output_dir, project_name)

    prediction = None

    with tempfile.NamedTemporaryFile(mode='w+', suffix=".java") as tmp:
        tmp.write(fileContent)
        tmp.flush()

        filepath = os.path.join(output_dir, tmp.name)

        print("project path: ", project_path)
        print("file path: ", filepath)

        prediction = predict(project_path,filepath)

    return prediction


async def analyze_project(github_url: str, project_files) -> list:
    project_name = github_url.split('/')[-1].replace('.git', '')
    output_dir = os.path.join(BASE_DIR, project_name + "_project")
    project_path = os.path.join(output_dir, project_name)
    # print(f"Project name: {project_name}")
    # print(f"Output Directory: {output_dir}")
    # print(f"Project path: {project_path}")

    results = []
    for file in project_files:
        try:
            # Temporarily save file content to a file to process it
            with tempfile.NamedTemporaryFile(mode='w+', suffix=".java") as tmp:
                tmp.write(file.content)
                tmp.flush()
                filepath = os.path.join(output_dir, tmp.name)
                # print(f"File path: {filepath}")

                prediction_result = predict(project_path, filepath)
                # print(prediction_result)

            processed_result = {
                "url": file.url,
                "density": prediction_result.get("density", None),
                "predictedDensity": prediction_result.get("predictedDensity", None),
                "difference": abs(prediction_result.get("density", None) - prediction_result.get("predictedDensity", None))
            }
            results.append(processed_result)

        except Exception as e:
            print(f"Error processing file {file.url}: {e}")
            continue
    # print(results)

    return results
