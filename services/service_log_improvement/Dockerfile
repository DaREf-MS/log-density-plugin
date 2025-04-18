# Use official Python image
FROM python:3.11

# Set the working directory inside the container
WORKDIR /service_log_improvement

# Copy the requirements.txt file from the parent folder
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r ./requirements.txt

# Copy the entire project, ensuring you copy from the parent folder into the container
COPY . service_log_improvement

# Set PYTHONPATH so Python recognizes `app` as a module
ENV PYTHONPATH=/service_log_improvement

# Expose FastAPI port
EXPOSE 8000

# Run FastAPI app
CMD ["uvicorn", "service_log_improvement.initializer:app", "--host", "0.0.0.0", "--port", "8000"]