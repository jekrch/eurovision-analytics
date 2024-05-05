# Eurovision Analytics :globe_with_meridians:

This project sets up a PostgreSQL database containing participant and voting data from all Eurovision contests going back to 1956. You can use this to answer interesting, complex questions about the contest. See [Use Cases](#use_cases) for some cool examples.

Flyway is used for schema migrations and to import data from provided CSV files. These files are generated by the [Eurovision Scraper](https://github.com/jekrch/eurovision-scraper) companion project, which compiles Eurovision participant and voting data from Wikipedia.

The database is containerized using Docker Compose for easy setup and deployment.

## Getting Started

1. Clone the repository:
    ```
    git clone https://github.com/jekrch/eurovision-analytics.git
    cd eurovision-analytics
    ```

2. Place the following CSV files in the `data` directory (or use the provided default files):
    - `eurovision_vote_data.csv`
    - `eurovision_participant_data.csv`

    You can either use the provided default source files or generate new source files using my [Eurovision Scraper](https://github.com/jekrch/eurovision-scraper) project.

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

    The staging tables will be available in the `eurovision` database, and you can query them to access the imported data.

## Use Cases <a id="use_cases"></a> :mag_right:

You can answer all kinds of interesting, complex questions with this normalized data. Here are several examples to get you started!

#### 1. Which Eurovision songs were written in an imaginary language?

```sql
SELECT year, country, broadcaster, artist, song, language
FROM song_view
WHERE language = 'Imaginary'
```

| year | country | broadcaster | artist      | song      | language  |
|------|---------|-------------|-------------|-----------|-----------|
| 2003 | Belgium | RTBF        | Urban Trad  | Sanomi    | Imaginary |
| 2008 | Belgium | VRT         | Ishtar      | Julissi | Imaginary |
| ...  | ...     | ...         | ...         | ...       | ...       |

#### 2. Which artists competed in the most contests?

```sql
SELECT
  COUNT(*) AS song_count,
  artist,
  STRING_AGG(CAST(year AS TEXT), ', ' ORDER BY year ASC) as contest_years,
  STRING_AGG(DISTINCT country, ', ') as country
FROM song_view
GROUP BY artist
HAVING COUNT(*) > 1
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

#### 3. Which composers had the most songs in Eurovision?

```sql
SELECT
  COUNT(DISTINCT sv.song_id) AS song_count,
  c.name,
  STRING_AGG(CAST(sv.year AS TEXT), ', ' ORDER BY year ASC) as contest_years,
  STRING_AGG(DISTINCT sv.country, ', ') as country
FROM song_view sv
JOIN song_composer sc ON sc.song_id = sv.song_id
JOIN composer c ON c.id = sc.composer_id
GROUP BY c.name
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;
```

| song_count | name               | contest_years                                                            | country                                           |
|------------|--------------------|-------------------------------------------------------------------------------------|---------------------------------------------------|
| 24         | Ralph Siegel       | 1974, 1976, 1979, 1980, 1980, 1981, 1982, 1985, 1987, 1988, 1990, 1992, 1994, 1997, 1999, 2002, 2003, 2006, 2009, 2012, 2013, 2014, 2015, 2017 | Germany, Luxembourg, Montenegro, San Marino, Switzerland |
| 16         | Bernd Meinunger    | 1979, 1980, 1980, 1981, 1982, 1985, 1987, 1988, 1992, 1994, 1997, 1999, 2002, 2003, 2006, 2009 | Germany, Luxembourg, Montenegro, Switzerland      |
| 12         | Thomas G:son       | 2001, 2006, 2007, 2010, 2012, 2012, 2013, 2015, 2015, 2016, 2016, 2018    | Cyprus, Denmark, Georgia, Malta, Spain, Sweden    |
| 9          | Dimitris Kontopoulos | 2009, 2013, 2014, 2016, 2017, 2018, 2019, 2021, 2021                     | Azerbaijan, Greece, Moldova, Russia               |
| ...        | ...                | ...                                                                       | ...                                               |

## Neo4j graph data modeling :bar_chart:


In addition to PostgreSQL, this project also supports loading the Eurovision data into Neo4j which allows you to explore and analyze the data using graph-based queries and visualizations.

The Neo4j database is automatically set up and populated with data using Docker Compose. The provided `docker-compose.yml` file includes the necessary configuration to start a Neo4j container and execute the data migration scripts.

<img width="958" alt="image" src="https://github.com/jekrch/eurovision-analytics/assets/8173930/aabb4661-6636-4ec7-86c0-7d2df993f7af">

### Access the Neo4j Browser:

  1. Open a web browser and visit `http://localhost:7474`.
  2. Log in using the default credentials 
    
      * username: `neo4j`
      * password: `unitedbymusic`

### Graph-Based Analytics

With the Eurovision data loaded into Neo4j, you can perform various graph-based analyses and visualizations. Here are a few examples:

### The top ten most prolific Eurovision songwriters
```sql
MATCH (sw:Songwriter)<-[:WRITTEN_BY]-(s:Song)
WITH sw, collect(s) as songs
ORDER BY size(songs) DESC
RETURN sw, songs
LIMIT 10
```