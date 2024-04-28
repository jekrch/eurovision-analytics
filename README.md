# Eurovision Analytics

This project sets up a PostgreSQL database with Flyway for schema migrations and imports data from CSV files into staging tables. The database is containerized using Docker Compose for easy setup and deployment.

## Prerequisites

- Docker
- Docker Compose

## Getting Started

1. Clone the repository:
    ```
    git clone https://github.com/yourusername/eurovision-database.git
    cd eurovision-database
    ```

2. Place the following CSV files in the `data` directory:
    - `eurovision_vote_data.csv`
    - `eurovision_participant_data.csv`

    Make sure the CSV files have the expected headers and data format.

3. Start the containers:
        
    ```
    docker-compose up -d
    ```

    This command will start the PostgreSQL database and run the Flyway migration, creating the staging tables and importing the data from the CSV files.

4. Connect to the database:

    You can connect to the PostgreSQL database using a database client with the following details:

    - Host: `localhost`
    - Port: `5432`
    - Database: `eurovision`
    - Username: `postgres`
    - Password: `postgres`

    The staging tables will be available in the `eurovision` database, and you can query them to access the imported data.

## Use Cases

You can answer all kinds of interesting, complex questions with this normalized data. Here are several examples to get you started!

### Which Eurovision songs were written in an imaginary language?

```sql
SELECT *
FROM song_view
WHERE language = 'Imaginary'
```

| year | country | broadcaster | artist      | song      | language  | song_id | artist_id |
|------|---------|-------------|-------------|-----------|-----------|---------|-----------|
| 2003 | Belgium | RTBF        | Urban Trad  | Sanomi    | Imaginary | 832     | 1226      |
| 2008 | Belgium | VRT         | Ishtar      | Julissi | Imaginary | 997     | 1059      |
| ...  | ...     | ...         | ...         | ...       | ...       | ...     | ...       |

### Which artists competed in the most contests?

```sql
SELECT
  count(*) AS song_count,
  artist,
  STRING_AGG(CAST(year AS TEXT), ', ' ORDER BY year ASC) as contest_years,
  STRING_AGG(DISTINCT country, ', ') as country
FROM song_view
GROUP BY artist
HAVING count(*) > 1
ORDER BY COUNT(*) DESC;
```

| song_count | artist               | contest_years            | country                |
|------------|----------------------|--------------------------|------------------------|
| 4          | Peter, Sue and Marc  | 1971, 1976, 1979, 1981   | Switzerland            |
| 4          | Valentina Monetta    | 2012, 2013, 2014, 2017   | San Marino             |
| 4          | Fud Leclerc          | 1956, 1958, 1960, 1962   | Belgium                |
| 3          | Hot Eyes             | 1984, 1985, 1988         | Denmark                |
| 3          | Lys Assia            | 1956, 1957, 1958         | Switzerland            |
| ...        | ...                  | ...                      | ...                    |

### Which composers had the most songs in Eurovision?

```sql
SELECT
  count(DISTINCT sv.song_id) AS song_count,
  c.name,
  STRING_AGG(CAST(sv.year AS TEXT), ', ' ORDER BY year ASC) as contest_years,
  STRING_AGG(DISTINCT sv.country, ', ') as country
FROM song_view sv
JOIN song_composer sc ON sc.song_id = sv.song_id
JOIN composer c ON c.id = sc.composer_id
GROUP BY c.name
HAVING count(*) > 1
ORDER BY COUNT(*) DESC;
```

| song_count | name               | contest_years                                                            | country                                           |
|------------|--------------------|-------------------------------------------------------------------------------------|---------------------------------------------------|
| 24         | Ralph Siegel       | 1974, 1976, 1979, 1980, 1980, 1981, 1982, 1985, 1987, 1988, 1990, 1992, 1994, 1997, 1999, 2002, 2003, 2006, 2009, 2012, 2013, 2014, 2015, 2017 | Germany, Luxembourg, Montenegro, San Marino, Switzerland |
| 16         | Bernd Meinunger    | 1979, 1980, 1980, 1981, 1982, 1985, 1987, 1988, 1992, 1994, 1997, 1999, 2002, 2003, 2006, 2009 | Germany, Luxembourg, Montenegro, Switzerland      |
| 12         | Thomas G:son       | 2001, 2006, 2007, 2010, 2012, 2012, 2013, 2015, 2015, 2016, 2016, 2018    | Cyprus, Denmark, Georgia, Malta, Spain, Sweden    |
| 9          | Dimitris Kontopoulos | 2009, 2013, 2014, 2016, 2017, 2018, 2019, 2021, 2021                     | Azerbaijan, Greece, Moldova, Russia               |
| ...        | ...                | ...                                                                       | ...                                               |
