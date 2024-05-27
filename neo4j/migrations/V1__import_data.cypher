CALL apoc.load.jdbc(
  'jdbc:postgresql://db:5432/eurovision?user=postgres&password=postgres', 
  'SELECT * FROM song_view'
) YIELD row
MERGE (y:Year {year: row.year})
MERGE (c:Country {name: row.country})
MERGE (b:Broadcaster {name: row.broadcaster})
MERGE (a:Artist {id: row.artist_id, name: row.artist})
MERGE (s:Song {id: row.song_id, name: row.song})

MERGE (y)-[:HAS_SONG]->(s)
MERGE (s)-[:PERFORMED_BY]->(a)
MERGE (s)-[:REPRESENTS]->(c)
MERGE (s)-[:BROADCAST_BY]->(b)

WITH s, row
UNWIND split(row.language, ',') AS language
WITH s, row, trim(language) AS trimmedLanguage
WHERE trimmedLanguage <> ''
MERGE (l:Language {name: trimmedLanguage})
MERGE (s)-[:IN_LANGUAGE]->(l)
  
WITH s, row
UNWIND split(row.songwriters, ',') AS songwriter
  MERGE (sw:Songwriter {name: trim(songwriter)})
  MERGE (s)-[:WRITTEN_BY]->(sw)

FOREACH (conductor IN CASE WHEN row.conductor IS NOT NULL THEN [row.conductor] ELSE [] END |
  MERGE (co:Conductor {id: row.conductor_id, name: conductor})
  MERGE (s)-[:CONDUCTED_BY]->(co)
);

CALL apoc.load.jdbc(
  'jdbc:postgresql://db:5432/eurovision?user=postgres&password=postgres', 
  "SELECT * FROM vote_rank_view WHERE round = 'Final'"
) YIELD row
MATCH (s:Song {id: row.song_id})

WITH s, row WHERE row.final_place IS NOT NULL
SET s.totalPoints = row.total_points
MERGE (r:FinalPlace {place: row.final_place})
SET r.name = toString(row.final_place)
MERGE (s)-[:PLACED]->(r)

WITH s, row
SET s.finalRunningOrder = row.final_running_order
MERGE (ro:FinalRunningOrder {order: row.final_running_order})
SET ro.name = toString(row.final_running_order)
MERGE (s)-[:RUNNING_ORDER]->(ro);

CALL apoc.load.jdbc(
  'jdbc:postgresql://db:5432/eurovision?user=postgres&password=postgres', 
  "SELECT * FROM vote_rank_view WHERE round = 'Final' AND total_points = 0"
) YIELD row
MATCH (s:Song {id: row.song_id})
WITH s, row
MERGE (n:ZeroPoints)
SET n.name = toString('Zero Points')
MERGE (s)-[:RECEIVED]->(n);

CREATE CONSTRAINT unique_year IF NOT EXISTS FOR (y:Year) REQUIRE y.year IS UNIQUE;
CREATE CONSTRAINT unique_country IF NOT EXISTS FOR (c:Country) REQUIRE c.name IS UNIQUE;
CREATE CONSTRAINT unique_broadcaster IF NOT EXISTS FOR (b:Broadcaster) REQUIRE b.name IS UNIQUE;
CREATE CONSTRAINT unique_artist IF NOT EXISTS FOR (a:Artist) REQUIRE a.id IS UNIQUE;
CREATE CONSTRAINT unique_song IF NOT EXISTS FOR (s:Song) REQUIRE s.id IS UNIQUE;
CREATE CONSTRAINT unique_language IF NOT EXISTS FOR (l:Language) REQUIRE l.name IS UNIQUE;
CREATE CONSTRAINT unique_songwriter IF NOT EXISTS FOR (sw:Songwriter) REQUIRE sw.name IS UNIQUE;
CREATE CONSTRAINT unique_conductor IF NOT EXISTS FOR (co:Conductor) REQUIRE co.id IS UNIQUE;
CREATE CONSTRAINT unique_final_place IF NOT EXISTS FOR (r:FinalPlace) REQUIRE r.place IS UNIQUE;
CREATE CONSTRAINT unique_final_running_order IF NOT EXISTS FOR (ro:FinalRunningOrder) REQUIRE ro.order IS UNIQUE;