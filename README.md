# Event Booking System

Welcome to the Event Booking System! This project is designed to help users book events and manage their reservations with ease. It provides user authentication, event management, ticket booking, and periodic notifications for upcoming events.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## Introduction

The Event Booking System is a comprehensive solution for event management and booking. It allows users to register, authenticate, and book tickets for various events. The system also includes periodic notifications for upcoming events and maintains a history/audit log for all activities.

## Features

- User Registration and Authentication
- Event Creation and Management
- Ticket Booking
- Periodic Notifications for Upcoming Events
- History/Audit Log for Events
- Validation and Error Handling
- Secure Password Management

## Technologies Used

- Node.js
- Express.js
- TypeScript
- SQLite
- bcrypt
- JWT (JSON Web Tokens)
- Node-cron

## Installation

To get started with the Event Booking System, follow these steps:

1. Clone the repository:
    ```sh
    git clone https://github.com/your-username/event-booking-system.git
    ```

2. Navigate to the project directory:
    ```sh
    cd event-booking-system
    ```

3. Install the dependencies:
    ```sh
    npm install
    ```

4. Set up the environment variables:
    - Create a `.env` file in the root directory.
    - Add the following environment variables:
        ```env
        SECRET_KEY=your_secret_key
        ```
5. Build the project:
    ```sh
    npm run build
    ```

6. Start the server:
    ```sh
    npm start
    ```

The server will be running on `http://localhost:3000`.

## Usage

### Running Tests

To run the tests, use the following command:
```sh
npm test
```

### Building the Project
To build the project for production, use the following command:

```sh
npm run build
```
### Starting the Server
To start the server, use the following command:

```sh
npm start
```
### API Endpoints
Here are some of the key API endpoints available in the Event Booking System:

### User Authentication

 - POST /auth: Authenticate a user and generate a JWT.
 - POST /users: Register a new user.
 
 ### Event Management

 - POST /events: Create a new event.
 - GET /events: Get a list of events with optional filters.
 - GET /events/:eventId/tickets: Get all tickets for a specific event.

### Ticket Booking

 - POST /events/:eventId/tickets: Book a ticket for an event.
 - PUT /events/:eventId/tickets/:ticketId: Update a ticket.
 - DELETE /events/:eventId/tickets/:ticketId: Delete a ticket.
### User Booked Events

 - GET /users/me/booked-events: View booked events for the authenticated user.
 - DELETE /users/me/booked-events/:eventId: Cancel a reservation for a specific event.
### Contributing
We welcome contributions to the Event Booking System! 
### License
This project is licensed under the MIT License. See the LICENSE file for details.