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

# build java thing
WORKDIR /java_code
COPY ./preprocess_project /java_code 
RUN /java_code/gradlew installDist --no-daemon

# =================================================================================================================

# STAGE: get python requirements.txt 
FROM python:3.12-slim AS python_requirements

# install poetry
RUN pip install poetry
WORKDIR /poetry_project
ADD ./train_model /poetry_project 
RUN poetry export -f requirements.txt --output /poetry_project/requirements.txt

# =================================================================================================================

# STAGE: install R on a Java on base python image 
# make this 3.11-slim in the future
FROM python:3.11

# install python-pip
RUN apt-get update && apt-get install -y python3-pip

# Install R
WORKDIR /r_install
COPY ./install_R.sh /r_install
RUN chmod a+x /r_install/install_R.sh
RUN /r_install/install_R.sh

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

# install python requirements (using the requirements.txt made in earlier stage)
WORKDIR /train_model
COPY --from=python_requirements /poetry_project/requirements.txt /train_model/
RUN pip install --no-cache-dir -r /train_model/requirements.txt

# copy python script and R script
COPY ./train_model .



