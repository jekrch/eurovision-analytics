# Eurovision Analytics :globe_with_meridians:

This project sets up a PostgreSQL database with Flyway for schema migrations and imports data from CSV files into staging tables. The database is containerized using Docker Compose for easy setup and deployment.

## Getting Started

1. Clone the repository:
    ```
    git clone https://github.com/yourusername/eurovision-database.git
    cd eurovision-database
    ```

2. Place the following CSV files in the `data` directory (or use the provided default files):
    - `eurovision_vote_data.csv`
    - `eurovision_participant_data.csv`

    Make sure the CSV files have the expected headers and data format.

3. Start the containers:
        
    ```
    docker-compose up -d
    ```

    This command will start the PostgreSQL database and run the Flyway migrations, creating the db schema and importing the data from the CSV files.

4. Connect to the database:

    You can connect to the PostgreSQL database using a database client with the following details:

    - Host: `localhost`
    - Port: `5432`
    - Database: `eurovision`
    - Username: `postgres`
    - Password: `postgres`

