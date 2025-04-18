<!-- markdownlint-disable MD033 MD045 -->

# Userguide to the Log Assistant Tool

[[Return]](../USAGE.md)

## Table of Contents

- [Userguide to the Log Assistant Tool](#userguide-to-the-log-assistant-tool)
  - [Table of Contents](#table-of-contents)
  - [1. Introduction](#1-introduction)
  - [2. Setup](#2-setup)
  - [3. Getting Started](#3-getting-started)
  - [4. Using the Extension](#4-using-the-extension)
    - [4.1 Get model info](#41-get-model-info)
    - [4.2 Choosing a Model](#42-choosing-a-model)
    - [4.3 Setting up a token (Only for HuggingFace)](#43-setting-up-a-token-only-for-huggingface)
    - [4.4 Generating Log Advice](#44-generating-log-advice)
    - [4.5 Improving Existing Log(s)](#45-improving-existing-logs)

## 1. Introduction

Welcome to the user guide for the "Log Assistant Tool" extension, designed to suggest line of code to improve the logging density for a given Java file. This guide will help you get started with the tool.

The log assistant tool is a functionality of the log density analyzer tool that provides suggestions to improve the logging density in Java files. It uses a large language model that runs in Ollama to generate log advice at the line of code level. The tool is designed to help developers understand and optimize their logging practices.

## 2. Setup

Make sure you have followed the installation guide to install the extension.

## 3. Getting Started

1. Launch the extension by pressing the F5 key or by running the extension in **Run & Debug** or `npm start`.
2. An new window will open with the extension running.
3. Open the desired Java file, it should look like this:

<img src="../resources/userGuide/extension-ready.png" width="50%">

## 4. Using the Extension

### 4.1 Get model info

- To get the model currently configured, use the command `Log Advice Generator: Get Model Info`.

### 4.2 Choosing a Model

- The service will automatically start the download of the default model that is define in [model_config.js](../../logdensitytool/src/model_config.js).
- If you want to use another model, you can do so by using the command `Log Advice Generator: Change Model ID` and entering the model ID.

<img src="../resources/userGuide/change_model_id.png" width="50%">

### 4.3 Setting up a token (Only for HuggingFace)

- If you are using a model from HuggingFace, you will need to set up a token. You can do so by using the command `Log Advice Generator: Change Token` and entering the token.
  - If you do not have a token, you can get one by signing up on the HuggingFace website and creating a new token.

<img src="../resources/userGuide/change_token.png" width="50%">

### 4.4 Generating Log Advice

- To generate log advice, put your cursor on the line of code where you want to get advice and use the command `Log Advice Generator: Generate Log Advice`.
  - There are two ways to activate this command :
    - `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) or `F1`, type `Log Advice Generator: Generate Log Advice`
    - Right click on the line of code and select `Generate Log Advice`

<img src="../resources/userGuide/right-click-generate_log_advice.png" width="50%">

---

- The extension will request ollama to generate a log advice based on the line of code wanted and the code of the method/function where the line is.
- The log advice will be inserted in the file at the line of code where the cursor was.
- The extension now asks you to confirm if the generated log advice is correct.

<img src="../resources/userGuide/generated_log_advice.png" width="50%">

### 4.5 Improving Existing Log(s)

- To improve existing log(s), select a code block containing at least one log inside and use the command `Log Advice Generator: Improve Logs`.
  - There are two ways to activate this command :
    - `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) or `F1`, type `Log Advice Generator: Improve Logs`
    - Right click on the line of code and select `Improve Logs`

<img src="../resources/userGuide/right-click-improve-logs.png" width="50%">

- For each log in the selected code block: 
  - The extension will request ollama to improve the log based on the context and by checking for typos.
  - The improved log will be inserted where the previous one was. A comment stating the improvements will be inserted on top of the improved log.

- The extension now asks you to confirm if the improved log(s) is/are correct.

<img src="../resources/userGuide/generated_log_improvement.png" width="50%">

- If there are no significant changes found in the selected block, an alert will show up.

<img src="../resources/userGuide/improve_logs_no_changes_needed.png" width="50%">

