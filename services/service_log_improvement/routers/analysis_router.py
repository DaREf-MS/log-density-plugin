import json

from fastapi import APIRouter
import os
import re
from jinja2 import Environment, FileSystemLoader
from pydantic import BaseModel

from service_log_improvement.rest import ollama_client

router = APIRouter()

# Define a request model
class LogImprovementRequest(BaseModel):
    diff: str
    context: str

@router.post("/improve-logs")
def improve_logs(request: LogImprovementRequest):
    diff = request.diff
    context = request.context
    return improve_logs_be(diff, context)


def get_surrounding_lines_from_file(file_content, line_number, context_lines=4):
    """
    Get surrounding context lines from the file content around a given line number.

    :param file_path: The path to the file
    :param line_number: The line number for which to extract surrounding context
    :param context_lines: The number of lines of context (default is 2 before and after)
    :return: A list of surrounding lines (before and after the modified line)
    """
    context = ""

    # Read the file content
    lines = file_content.splitlines()

    # Find the starting point for extracting context lines
    start = max(0, line_number - context_lines - 1)  # 1-based to 0-based index
    end = min(line_number + context_lines, len(lines))  # 1-based to 0-based index

    # Extract context lines from the file
    for i in range(start, end):
        context += lines[i] + "\n"

    return context


def get_prompt_from_template():
    # Get the absolute path of the parent directory
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

    # Set up the Jinja2 environment
    env = Environment(loader=FileSystemLoader(base_dir))

    # Load the template file
    template = env.get_template("improve_log_prompt.jinja")

    return template


def get_modified_logs_from_diff(diff):
    """
    Extract modified or added log lines from the diff.
    """
    modified_logs = []  # Store modified log statements
    current_line_number = None  # Track the line number for additions

    for line in diff.split("\n"):
        # If it's a chunk header like '@@ -5,6 +10,11 @@', find the line number where changes start
        if line.startswith("@@"):
            match = re.search(r"\+(\d+)", line)
            if match:
                current_line_number = int(match.group(1)) - 1

        # Check for added or modified lines that contain log statements
        elif line.startswith("+") and not line.startswith("+++"):
            if "System.out." in line or "System.err." in line or "LOG." in line:
                if current_line_number is not None:
                    modified_line = line.lstrip("+")
                    leading_white_space = modified_line[: len(modified_line) - len(modified_line.lstrip())]
                    modified_logs.append((current_line_number + 1, modified_line.strip(), leading_white_space))  # 1-based index
                    current_line_number += 1

    return modified_logs


def improve_logs_be(diff, context):
    """
    Improves logs from a given diff file.
    """
    # Read the diff content from the diff file

    # Extract modified or added log lines
    modified_logs = get_modified_logs_from_diff(diff)

    # Load the template file
    template = get_prompt_from_template()

    # Generate improved logs using the template
    improved_logs = []
    for line_num, log, leading_white_space in modified_logs:

        surrounding_lines = get_surrounding_lines_from_file(context, line_num)

        prompt = template.render(log_message=log, context=surrounding_lines)
        print("Template Prompt")
        print(prompt)

        output = ollama_client.generate(prompt)
        print("LLM Output")
        print(output)

        output = json.loads(output)
        #"reason"
        improved_logs.append({"line": line_num, "original": log,
                              "suggested": leading_white_space + output["log_statement"],
                              "reason": output["reason"]})


    print(improved_logs)

    return improved_logs