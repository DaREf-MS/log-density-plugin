# Log Density Tool for Java

Welcome to the **Log Density Tool** for Java, a powerful Visual Studio Code extension designed to help developers optimize their logging practices. By predicting and analyzing log densities within Java projects, this tool aids in achieving efficient and meaningful logging.

## Features

The Log Density Tool provides an interactive way to analyze and optimize your Java code's logging practices through the following features:

- **Model Training**: Automatically train a machine learning model using data from open-source Java projects.
- **Log Density Analysis**: Visualize log density in every block of code with real-time updates as you navigate through your Java files.
- **Batch Analysis**: Assess and optimize log density for multiple Java files simultaneously, with results displayed in a user-friendly manner.

## Importance of Log Density

Understanding and managing log density is crucial for maintaining the performance and readability of applications. Excessive logging can slow down an application and lead to log files that are difficult to manage and analyze, while insufficient logging can obscure important information needed for diagnosing issues. This tool helps balance your logging levels, ensuring efficiency and clarity.

## Requirements

- Visual Studio Code
- Node.js and npm installed (for managing package dependencies)

## Installation and Setup

1. Clone this repository to your local machine.
2. Navigate to the `logdensitytool` directory.
3. Run `npm install` to install all dependencies.

## Usage

- **Activate the Command Palette** (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS), type `Send Github URL`, and enter a GitHub URL to start model training.
- If a model exists, navigate through your Java files to see real-time log density annotations.
- For batch analysis, use the **Java Files and Analyze Files** views. Select the files, then press `Analyze` to begin. Analysis might take approximately 1 minute per 50-75 medium-length files (about 300 lines each).
- Color-coded results indicate log density discrepancies: red for significant differences, yellow for moderate, and green for minimal or no differences.

## Known Issues

- Large projects may experience delayed analysis results.
- Some files containing few code lines may not be analyzed by our model.

## Release Notes

### 1.0.0

- Initial release with log density prediction and batch file analysis.


**Enjoy optimizing your Java projects with the Log Density Tool!**
