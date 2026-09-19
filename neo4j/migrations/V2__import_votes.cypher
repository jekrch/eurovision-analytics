// Every point one country gave another, as a relationship between the two
// Country nodes: (voter)-[:GAVE_POINTS {year, round, voteType, points}]->(recipient).
//
// Some scraped scoreboards picked up the "total" column as if it were another
// voter, which shows up as a voter giving more than 12 points. A voter's whole
// set for that contest is dropped when any of its points exceed 12, since the
// rest of the set is usually misaligned too.
CALL apoc.load.jdbc(
  'jdbc:postgresql://db:5432/eurovision?user=postgres&password=postgres',
  "SELECT year, round, vote_type, voting_country, country, points
   FROM (
     SELECT vv.*, MAX(points) OVER (PARTITION BY year, round, vote_type, voting_country) AS max_points
     FROM vote_view vv
   ) v
   WHERE max_points <= 12 AND points > 0"
) YIELD row
MERGE (voter:Country {name: row.voting_country})
MERGE (recipient:Country {name: row.country})
MERGE (voter)-[v:GAVE_POINTS {year: row.year, round: row.round, voteType: row.vote_type}]->(recipient)
SET v.points = row.points;
