# CIPHER AI

Document Masking and Redaction System

## Project Overview
The Document Masking and Redaction System is a Flask-based web application designed to mask sensitive information in various document types, including images, PDFs, and text files. The system utilizes machine learning models and regular expressions to identify and redact personally identifiable information (PII) and other sensitive data.

## Problem Statement & Goals
The primary problem addressed by this repository is the need to protect sensitive information in documents from unauthorized access. The system aims to provide a secure and efficient way to mask and redact sensitive data, ensuring compliance with data protection regulations. The goals of this project are:

* To develop a robust and scalable document masking and redaction system
* To provide a user-friendly interface for uploading and processing documents
* To integrate machine learning models and regular expressions for accurate PII detection

## Domain Concept Explanation
The domain concept of this system revolves around document masking and redaction. Document masking refers to the process of hiding or obscuring sensitive information in a document, while redaction refers to the process of permanently removing or deleting sensitive information. The system interprets this concept by utilizing machine learning models and regular expressions to identify and mask PII, such as names, emails, phone numbers, and financial information.

## Solution Approach
The system solves the problem of document masking and redaction by utilizing a combination of machine learning models and regular expressions. The solution approach involves the following steps:

* Uploading a document to the system
* Preprocessing the document to extract text and images
* Utilizing machine learning models and regular expressions to identify PII
* Masking or redacting the identified PII
* Returning the processed document to the user

## Technical Architecture
The technical architecture of the system consists of the following components:
```
+---------------+
|  Frontend   |
+---------------+
          |
          |
          v
+---------------+
|  Flask App  |
+---------------+
          |
          |
          v
+---------------+
|  Masking Engine|
+---------------+
          |
          |
          v
+---------------+
|  Machine Learning|
|  Models (Groq, Gemini)|
+---------------+
```
The frontend is built using HTML, CSS, and JavaScript, and provides a user-friendly interface for uploading and processing documents. The Flask app handles the backend logic, including document preprocessing, PII detection, and masking. The masking engine is responsible for integrating the machine learning models and regular expressions to identify and mask PII.

## Key Components & Implementation Details
The key components of the system include:

* `app.py`: The Flask app that handles the backend logic
* `masking_engine.py`: The masking engine that integrates the machine learning models and regular expressions
* `frontend`: The frontend code that provides a user-friendly interface for uploading and processing documents
* `requirements.txt`: The dependencies required by the system

The implementation details of the system include:

* Utilizing the `fitz` library to preprocess PDF documents
* Utilizing the `PIL` library to preprocess image documents
* Utilizing the `google-generativeai` library to integrate the Gemini machine learning model
* Utilizing the `groq` library to integrate the Groq machine learning model

## System Logic / Analytics Insights
The system logic involves the following steps:

* Uploading a document to the system
* Preprocessing the document to extract text and images
* Utilizing machine learning models and regular expressions to identify PII
* Masking or redacting the identified PII
* Returning the processed document to the user

The analytics insights of the system include:

* Utilizing the `analyze_text_for_pii` function to identify PII in text documents
* Utilizing the `analyze_image_for_pii` function to identify PII in image documents
* Utilizing the `mask_pii` function to mask or redact identified PII

## Usage / Workflow
The usage workflow of the system involves the following steps:

* Uploading a document to the system through the frontend interface
* Selecting the masking options, such as the type of PII to mask and the masking style
* Submitting the document for processing
* Receiving the processed document with masked PII

## Folder Structure
The folder structure of the system is as follows:
```
.
├── app.py
├── frontend
├── masking_engine.py
├── processed
├── requirements.txt
├── sample_confidential.txt
├── static
├── templates
└── uploads
```
The `app.py` file contains the Flask app logic, while the `masking_engine.py` file contains the masking engine logic. The `frontend` folder contains the frontend code, while the `processed` folder contains the processed documents. The `requirements.txt` file contains the dependencies required by the system.

## Installation & Setup
To install and set up the system, follow these steps:
```bash
# Clone the repository
git clone https://github.com/username/repository.git

# Install the dependencies
pip install -r requirements.txt

# Run the Flask app
python app.py
```
## Real-World Applications
The real-world applications of the system include:

* Document redaction for compliance with data protection regulations
* Image redaction for privacy protection
* Text redaction for sensitive information protection

## Future Enhancements
The future enhancements of the system include:

* Integrating more machine learning models and regular expressions for improved PII detection
* Improving the user interface for easier document uploading and processing
* Adding more masking options, such as custom keywords and regex patterns
