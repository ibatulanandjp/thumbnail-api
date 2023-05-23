# EmojiThumb: Emoji Thumbnail API

A long-running job API for generating thumbnails of Emojis.

## Table of Contents

- [EmojiThumb: Emoji Thumbnail API](#emojithumb-emoji-thumbnail-api)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation and Setup](#installation-and-setup)
  - [Usage](#usage)
  - [Running Tests](#running-tests)
  - [Architecture](#architecture)
    - [Solution Structure](#solution-structure)
    - [Technologies used to implement the solution:](#technologies-used-to-implement-the-solution)
    - [Libraries/Packages used in the project:](#librariespackages-used-in-the-project)
  - [Trade-offs and Future Improvements](#trade-offs-and-future-improvements)
  - [Future Implementation Scope](#future-implementation-scope)
  - [Deployment \& Management in Production](#deployment--management-in-production)


&nbsp;

## Introduction

The engineers at Cogent Labs like to create custom emojis for their communication apps, which requires them to create many small thumbnail images. "EmojiThumb" is a long-running job API that accepts image files, generates thumbnails, and allows users to fetch the thumbnails once the processing is complete.

With "EmojiThumb," engineers can easily upload their image files and receive optimized thumbnails tailored for their communication apps. The API provides a seamless and efficient way to generate custom emojis, enhancing the communication experience for Cogent Labs' users.

&nbsp;

## Getting Started

### Prerequisites

- Docker and Docker Compose should be installed.

### Installation and Setup

1. Navigate to the project directory:
   ```
   cd thumbnail-api
   ```

2. Setup Environment Variable
   - Create a `.env` file in directory `/thumbnail-api/src/config` and define the following variables:
        ```
        PORT=3000
        MONGODB_URI=mongodb://mongodb:27017
        DB_NAME=job-app
        COLLECTION_NAME=jobs
        
        RABBITMQ_URI=amqp://rabbitmq:5672
        QUEUE_NAME=jobs
        IS_WORKER_RUNNING=false
        ```
   
3. Build and start the containers:
   ```
   docker compose up --build -d
   ```

&nbsp;

## Usage

The system should now be up and running. You can access the API endpoints and interact with the system using tools like Postman or cURL.

- API endpoints:
  - Endpoint 1: CreateJob
    - Description: Endpoint to create a thumbnail generation job, by uploading an image
    - Method: POST
    - Path: `/api/upload`
    - Request:
      ```
      curl --location '127.0.0.1:3000/api/upload' \
      --form 'image=@"path/to/image.jpg"'
      ```
    - Response:
      ```
      {
        "jobId":"646cc03067cd6aff9f9b1539"
      }
      ```


  - Endpoint 2: GetJobById
    - Description: Endpoint to get the status of a thumbnail job for a job id
    - Method: GET
    - Path: `/api/job/:id/`
    - Request:
      ```
      curl --location '127.0.0.1:3000/api/job/646cc03067cd6aff9f9b1539'
      ```
    - Response:
      ```
      {
        "status":"succeeded"
      }
      ```


  - Endpoint 3: GetThumbnail
    - Description: Endpoint to get the thumbnail for a job id
    - Method: GET
    - Path: `/api/job/:id/thumbnail`
    - Request:
      ```
      curl --location '127.0.0.1:3000/api/job/646cc03067cd6aff9f9b1539/thumbnail' \
      --output '/path/to/thumbnail-output.jpg'
      ```
    - Response:
      ```
        (Downloads the output thumbnail image at location '/path/to/thumbnail-output.jpg')
        % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
        100  2382  100  2382    0     0  33229      0 --:--:-- --:--:-- --:--:-- 34028
      ```


  - Endpoint 4: ListJobs
    - Description: Endpoint to list jobs 
    - Method: GET
    - Path: `/api/jobs`
    - Request:
      ```
      curl --location '127.0.0.1:3000/api/jobs'
      ```
    - Response:
      ```
      {
        "jobs": [
          {
            "_id": "646cc03067cd6aff9f9b1539",
            "imageFilename": "0f6590f2-3a36-459b-8704-6be696edff1c-image.jpg",
            "status": "succeeded",
            "createdAt": "2023-05-23T13:31:28.000Z"
          }
        ]
      }
      ```


  - Endpoint 5: DeleteJobById
    - Description: Endpoint to delete job by id 
    - Method: DELETE
    - Path: `/api/job/:id`
    - Request:
      ```
      curl --location --request DELETE '127.0.0.1:3000/api/job/646cc03067cd6aff9f9b1539'
      ```
    - Response:
      ```
      {
        "message":"Job deleted successfully"
      }
      ```

&nbsp;    

## Running Tests

To run the tests of the project, follow these steps:

1. Ensure that the Docker containers are running using the following command:
   ```
   docker compose up --build -d
   ```

2. Access the running container and run the test inside the container, by executing the following command:
   ```
   docker exec -it <container_name> npm test
   ```
   e.g.
   ```
   docker exec -it thumbnail-api-app-1 npm test
   ```

&nbsp;


## Architecture

To achieve a long-running job API, this project uses a queue-based worker architecture. When a user submits an image, the API will enqueue a job request containing the image details. Worker will then process the jobs asynchronously and generate thumbnail. The job status will be stored in a database for easy retrieval. Once a job is completed, the thumbnail can be fetched using the API.

### Solution Structure
1. API Server: An Express.js server that exposes endpoints for submitting images, checking job status, fetching thumbnails, listing all submitted jobs, and deleting job from the database.
2. Job Queue: A RabbitMQ message queue to store incoming job requests.
3. Worker: A separate process that listens to the job queue, processes the jobs, and generates thumbnails.
4. Database: A MongoDB database to store job statuses and related information.
5. Storage: A location in local file system to save the original images and generated thumbnails.

### Technologies used to implement the solution:
- Language: JavaScript
- Framework: Node.js, Express.js
- Message Broker (Queueing System): RabbitMQ
- Database: MongoDB
- Testing Framework: Jest
- Thumbnail Processing: Sharp

### Libraries/Packages used in the project:
- express: Web framework for Node.js, used to create REST APIs.
- mongodb: MongoDB driver, used to connect and store job related information into MongoDB database. 
- amqplib: Node.js client for RabbitMQ, used as a message broker (queue) to process thumbnails asynchronously. 
- multer: Middleware, used for handling image file uploads.
- sharp: Image processing library, used to generate thumbnails.
- uuid: Library, for generating unique identifiers (UUIDs) to attach to the original filename.
- dotenv: Module, used to load environment variables from a .env file into process.env.
- winston: Logging library, used for server logging.
- winston-daily-rotate-file: Transport, to rotate logs files daily and keep a maximum of 7 days.
- jest: JavaScript testing framework, used to write unit tests.
- supertest: Testing library, used to test API endpoints.

&nbsp;


## Trade-offs and Future Improvements

During the development of the project, the following trade-offs were made:

- Trade-off 1: Due to time constraints, certain features or optimizations were left out. These can be further developed in the future.
- Trade-off 2: The system currently runs on a single instance, but to put it into production, it would need to be deployed in a clustered environment to ensure high availability and fault tolerance.
- Trade-off 3: Load testing and performance optimization were not extensively conducted, but they are important considerations for handling high loads of requests.
- Trade-off 4: Monitoring and management tools such as metrics collection, and alerting were not implemented in the current version. These can be integrated in future iterations for better observability.

Future improvements for the project include:

- Improvement 1: Implementing a caching layer to improve the system's performance and reduce database load.
- Improvement 2: Adding authentication and authorization mechanisms to secure the API endpoints.
- Improvement 3: Implementing extensive automated tests to ensure code quality and prevent regressions.
- Improvement 4: Scaling the system horizontally by introducing load balancers and multiple instances of the API server to handle increased traffic.

&nbsp;


## Future Implementation Scope

The future implementation scope includes:

- Implementing error handling and retry mechanisms for robustness.
- Incorporating input validation and sanitization to ensure data integrity and security.
- Enhancing the logging mechanism to capture detailed information for debugging and monitoring purposes.
- Implementing backup and disaster recovery strategies for the database.
- Implementing container orchestration tools like Kubernetes for managing the deployment and scaling of containers.

&nbsp;


## Deployment & Management in Production

For deploying and managing the containerized application in production, the following steps can be followed:

1. Set up a production environment with necessary infrastructure components such as load balancers, monitoring tools, and database clusters.
2. Build production-ready Docker images for the application.
3. Deploy the containers using container orchestration tools like Kubernetes.
4. Configure scaling policies based on traffic patterns and resource utilization to handle varying workloads.
5. Implement logging and monitoring solutions to capture metrics, logs, and traces for better observability.
6. Set up continuous integration and deployment (CI/CD) pipelines for seamless deployment and updates.
7. Regularly monitor the application's performance, conduct load testing, and perform necessary optimizations to ensure optimal performance and scalability.

&nbsp;
