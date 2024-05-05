CALL apoc.load.jdbc('jdbc:postgresql://db:5432/eurovision?user=postgres&password=postgres', 'SELECT * FROM song_view') YIELD row
MERGE (y:Year {year: row.year})
MERGE (c:Country {name: row.country})
MERGE (b:Broadcaster {name: row.broadcaster})
MERGE (a:Artist {id: row.artist_id, name: row.artist})
MERGE (s:Song {id: row.song_id, name: row.song, language: row.language})
MERGE (y)-[:HAS_SONG]->(s)
MERGE (s)-[:PERFORMED_BY]->(a)
MERGE (s)-[:REPRESENTS]->(c)
MERGE (s)-[:BROADCAST_BY]->(b)
FOREACH (songwriter IN split(row.songwriters, ',') |
  MERGE (sw:Songwriter {name: trim(songwriter)})
  MERGE (s)-[:WRITTEN_BY]->(sw)
)
FOREACH (conductor IN CASE WHEN row.conductor IS NOT NULL THEN [row.conductor] ELSE [] END |
  MERGE (co:Conductor {id: row.conductor_id, name: conductor})
  MERGE (s)-[:CONDUCTED_BY]->(co)
);

CALL apoc.load.jdbc('jdbc:postgresql://db:5432/eurovision?user=postgres&password=postgres', "SELECT * FROM vote_rank_view WHERE round = 'Final'") YIELD row
MATCH (s:Song {id: row.song_id})
WITH s, row
WHERE row.rank IS NOT NULL
SET s.totalPoints = row.total_points
MERGE (r:FinalRank {rank: row.rank})
SET r.name = toString(row.rank)
MERGE (s)-[:RANKED]->(r);