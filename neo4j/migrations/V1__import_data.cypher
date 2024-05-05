CALL apoc.load.jdbc('jdbc:postgresql://db:5432/eurovision?user=postgres&password=postgres', 'SELECT * FROM vote_view') YIELD row
MERGE (y:Year {year: row.year})
MERGE (c:Country {name: row.country, code: row.country_code})
MERGE (vc:Country {name: row.voting_country, code: row.voting_country_code})
MERGE (v:Vote {id: row.vote_id, points: row.points, name: toString(row.points)})
WITH y, c, vc, v, row
FOREACH (_ IN CASE
    WHEN row.round = 'Final' AND row.vote_type = 'Total' THEN [1] ELSE [] END |
    MERGE (y)-[:HAS_FINAL_TOTAL_VOTE]->(v)
)
FOREACH (_ IN CASE
    WHEN row.round = 'Final' AND row.vote_type = 'Jury' THEN [1] ELSE [] END |
    MERGE (y)-[:HAS_FINAL_JURY_VOTE]->(v)
)
FOREACH (_ IN CASE
    WHEN row.round = 'Final' AND row.vote_type = 'Televote' THEN [1] ELSE [] END |
    MERGE (y)-[:HAS_FINAL_TELEVOTE_VOTE]->(v)
)
FOREACH (_ IN CASE
    WHEN row.round = 'Semi-Final' AND row.vote_type = 'Total' THEN [1] ELSE [] END |
    MERGE (y)-[:HAS_SEMIFINAL_TOTAL_VOTE]->(v)
)
FOREACH (_ IN CASE
    WHEN row.round = 'Semi-Final' AND row.vote_type = 'Jury' THEN [1] ELSE [] END |
    MERGE (y)-[:HAS_SEMIFINAL_JURY_VOTE]->(v)
)
FOREACH (_ IN CASE
    WHEN row.round = 'Semi-Final' AND row.vote_type = 'Televote' THEN [1] ELSE [] END |
    MERGE (y)-[:HAS_SEMIFINAL_TELEVOTE_VOTE]->(v)
)
FOREACH (_ IN CASE
    WHEN row.round = 'Semi-Final 1' AND row.vote_type = 'Total' THEN [1] ELSE [] END |
    MERGE (y)-[:HAS_SEMIFINAL1_TOTAL_VOTE]->(v)
)
FOREACH (_ IN CASE
    WHEN row.round = 'Semi-Final 1' AND row.vote_type = 'Jury' THEN [1] ELSE [] END |
    MERGE (y)-[:HAS_SEMIFINAL1_JURY_VOTE]->(v)
)
FOREACH (_ IN CASE
    WHEN row.round = 'Semi-Final 1' AND row.vote_type = 'Televote' THEN [1] ELSE [] END |
    MERGE (y)-[:HAS_SEMIFINAL1_TELEVOTE_VOTE]->(v)
)
FOREACH (_ IN CASE
    WHEN row.round = 'Semi-Final 2' AND row.vote_type = 'Total' THEN [1] ELSE [] END |
    MERGE (y)-[:HAS_SEMIFINAL2_TOTAL_VOTE]->(v)
)
FOREACH (_ IN CASE
    WHEN row.round = 'Semi-Final 2' AND row.vote_type = 'Jury' THEN [1] ELSE [] END |
    MERGE (y)-[:HAS_SEMIFINAL2_JURY_VOTE]->(v)
)
FOREACH (_ IN CASE
    WHEN row.round = 'Semi-Final 2' AND row.vote_type = 'Televote' THEN [1] ELSE [] END |
    MERGE (y)-[:HAS_SEMIFINAL2_TELEVOTE_VOTE]->(v)
)
MERGE (v)-[:TO]->(c)
MERGE (v)-[:FROM]->(vc);


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