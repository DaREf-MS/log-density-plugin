# =================================================================================================================
# STAGE: build JRE, build java, version >11
FROM eclipse-temurin:21 as jre_build

# Create a custom Java runtime
RUN $JAVA_HOME/bin/jlink \
         --add-modules java.base \
         --add-modules java.compiler \
         --strip-debug \
         --no-man-pages \
         --no-header-files \
         --compress=2 \
         --output /javaruntime

# TODO - Is this really necessary? can't we just build locally and copy the executable into the docker? java is supposed to be compile once run anywhere
# build java thing
WORKDIR /java_code
COPY ./preprocess_project /java_code
RUN chmod u+x /java_code/gradlew
RUN /java_code/gradlew installDist --no-daemon


# =================================================================================================================

# STAGE: get python requirements.txt
FROM python:3.11-slim AS python_requirements

# install poetry
RUN pip install poetry==1.5.1
WORKDIR /poetry_project
COPY ./pyproject.toml /poetry_project/
RUN poetry lock
RUN poetry export -f requirements.txt --output /poetry_project/requirements.txt

# =================================================================================================================
# make this 3.11-slim in the future
FROM python:3.11

# install python requirements (using the requirements.txt made in earlier stage)
WORKDIR /app
COPY --from=python_requirements /poetry_project/requirements.txt /app/
RUN pip install --no-cache-dir -r /app/requirements.txt

# Install R
WORKDIR /r_install
#COPY ./service_model_creation/install_R.sh /r_install
#RUN chmod a+x /r_install/install_R.sh
#RUN /r_install/install_R.sh
RUN apt update -qq
RUN apt install --no-install-recommends -y software-properties-common dirmngr
RUN wget -qO- https://cloud.r-project.org/bin/linux/ubuntu/marutter_pubkey.asc | tee -a /etc/apt/trusted.gpg.d/cran_ubuntu_key.asc
RUN add-apt-repository "deb https://cloud.r-project.org/bin/linux/ubuntu $(lsb_release -cs)-cran40/"
RUN apt install --no-install-recommends -y r-base

# copy over JRE
WORKDIR /javaruntime
COPY --from=jre_build /javaruntime /javaruntime/
# Set JAVA_HOME environment variable
ENV JAVA_HOME /javaruntime/
# Set PATH to include Java binaries
ENV PATH $PATH:$JAVA_HOME/bin

# copy over compiled Java
WORKDIR /preprocess_project
COPY --from=jre_build /java_code/build/install/preprocess_project /preprocess_project/
ENV PATH $PATH:/preprocess_project/bin

# copy python script and R script
COPY . /app
# TODO - limit copying to needed files only

# Command to run the FastAPI application
WORKDIR /app

ENV PYTHONPATH "${PYTHONPATH}:/app"
RUN echo $PYTHONPATH

EXPOSE 8080

CMD ["uvicorn", "service_model_creation.main:app", "--host", "0.0.0.0", "--port", "8080"]