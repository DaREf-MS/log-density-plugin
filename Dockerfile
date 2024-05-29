# STAGE: get python requirements.txt
FROM python:3.12-slim AS python_requirements

# install poetry

# ENV POETRY_HOME="/opt/poetry"
# # make poetry install to this location
# RUN curl -sSL https://install.python-poetry.org | python3 -
RUN pip install poetry
WORKDIR /poetry_project
# TODO - comparmentalize code into folders, for more targetted faster copying
ADD . /poetry_project 
RUN poetry export -f requirements.txt --output /poetry_project/requirements.txt

# TODO - have a separate stage for building JRE
# TODO - have a separate stage for java app JRE

# ===================================================================================

# STAGE: install python and R on a Java
# start with an image with java
FROM eclipse-temurin:8 as base

# install python
RUN apt-get update && apt-get install -y python3-pip

# Install R
WORKDIR /code
COPY ./install_R.sh /code
RUN chmod a+x /code/install_R.sh
RUN /code/install_R.sh

# TODO - decide on which version to lock in specifically
# TODO - put this image in dockerhub for faster pipeline builds


# # SECOND STAGE: build the thing
# FROM pfe-base-image AS build

# install python requirements (using the requirements.txt made in earlier stage)
WORKDIR /code
COPY --from=python_requirements /poetry_project/requirements.txt /code
RUN pip install --no-cache-dir -r /code/requirements.txt

# build java thing
WORKDIR /java_code
COPY . /java_code 
RUN /java_code/gradlew installDist --no-daemon
# copy install to app folder
WORKDIR /java_code



