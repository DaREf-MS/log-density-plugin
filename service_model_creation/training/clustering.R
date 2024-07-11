#Libraries to call (install.packages before)
options(repos = c(CRAN = "https://cloud.r-project.org/"))
# Check if packages are installed, if not, install them
if (!requireNamespace("Ckmeans.1d.dp", quietly = TRUE)) {
  install.packages("Ckmeans.1d.dp")
}
if (!requireNamespace("stats", quietly = TRUE)) {
  install.packages("stats")
}
if (!requireNamespace("dplyr", quietly = TRUE)) {
  install.packages("dplyr")
}

# Load required libraries
library(Ckmeans.1d.dp)
library(stats)
library(dplyr)

ckmeans_function <- function(data,column_index,clustersNumber){
  clean_data <- na.omit(data[[column_index]])
  numeric_data <- as.numeric(clean_data)
  sorted_data <- sort(numeric_data)
  L <- length(sorted_data)
  if (L>1){
    breaks <- Ckmeans.1d.dp(sorted_data,k=clustersNumber)
    result <- data.frame(sorted_data, regression=breaks$cluster-1)
  } else {
    result <- data.frame(sorted_data, regression=0) # TODO - this seems to crash
  }
  return(result)
}


args <- commandArgs(trailingOnly = TRUE)
inputPath <- paste(args, "_MLdata_FileLevel.csv", sep = "")
print("here is the input path")
print(inputPath)
log_density_metrics <- na.omit(read.csv(inputPath, header=TRUE, sep=","))
data <- data.frame(logDensity = log_density_metrics$logDensity)
data <- data.frame(logDensity = data[data$logDensity>0,])
optimal_ck <- ckmeans_function(data, 1, 5)

first_optimal_threshold <- optimal_ck$sorted_data[min(which(optimal_ck$regression == 1))]
second_optimal_threshold <- optimal_ck$sorted_data[min(which(optimal_ck$regression == 2))]
third_optimal_threshold <- optimal_ck$sorted_data[min(which(optimal_ck$regression == 3))]
fourth_optimal_threshold <- optimal_ck$sorted_data[min(which(optimal_ck$regression == 4))]


log_density_metrics$class <- 0
log_density_metrics$class[log_density_metrics$logDensity > 0 & log_density_metrics$logDensity <= first_optimal_threshold] <- 1
log_density_metrics$class[log_density_metrics$logDensity > first_optimal_threshold & log_density_metrics$logDensity <= second_optimal_threshold] <- 2
log_density_metrics$class[log_density_metrics$logDensity > second_optimal_threshold & log_density_metrics$logDensity <= third_optimal_threshold] <- 3
log_density_metrics$class[log_density_metrics$logDensity > third_optimal_threshold & log_density_metrics$logDensity <= fourth_optimal_threshold] <- 4
log_density_metrics$class[log_density_metrics$logDensity > fourth_optimal_threshold] <- 5

# Output the thresholds
print(paste("threshold1: ", first_optimal_threshold))
print(paste("threshold2: ", second_optimal_threshold))
print(paste("threshold3: ", third_optimal_threshold))
print(paste("threshold4: ", fourth_optimal_threshold))

outputPath <- paste(args, "_MLdata_FileLevel_WithClusters.csv", sep = "")
write.csv(log_density_metrics, file = outputPath, row.names = FALSE)


#INPUT: project + '_MLdata_FileLevel.csv'
#OUTPUT: project + '_MLdata_FileLevel_WithClusters.csv'
