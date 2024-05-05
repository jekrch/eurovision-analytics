CALL apoc.load.jdbc('jdbc:postgresql://db:5432/eurovision?user=postgres&password=postgres', 'SELECT * FROM vote_view') YIELD row
MERGE (y:Year {year: row.year})
MERGE (c:Country {name: row.country, code: row.country_code})
MERGE (vc:Country {name: row.voting_country, code: row.voting_country_code})
MERGE (y)-[:HAS_VOTE]->(v:Vote {id: row.vote_id, round: row.round, type: row.vote_type, points: row.points})
MERGE (v)-[:FROM]->(c)
MERGE (v)-[:TO]->(vc);

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