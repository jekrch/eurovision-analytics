-- a view that aggregates/denormalizes song data
CREATE OR REPLACE VIEW song_view AS
SELECT
  s.year,
  c.name AS country,
  s.broadcaster,
  a.name AS artist,
  s.name AS song,
  s.language,
  STRING_AGG(cp.name, ',' ORDER BY cp.name) FILTER (WHERE TRIM(cp.name, chr(160)) <> '') AS songwriters,
  cd.name AS conductor,
  a.id AS artist_id, 
  s.id AS song_id,
  cd.id AS conductor_id,
  c.id AS country_id
FROM song s
JOIN artist a ON s.artist_id = a.id
JOIN country c ON s.country_id = c.id
LEFT JOIN song_composer sc ON s.id = sc.song_id
LEFT JOIN composer cp ON sc.composer_id = cp.id
LEFT JOIN song_conductor scd ON s.id = scd.song_id
LEFT JOIN conductor cd ON scd.conductor_id = cd.id
GROUP BY
  s.year,
  c.name,
  s.broadcaster,
  a.name,
  a.wiki_url,
  s.name,
  s.wiki_url,
  s.language,
  cd.name,
  a.id, 
  s.id,
  cd.id,
  c.id;


-- this aggregates voting data between countries for different years and rounds voting types 
CREATE OR REPLACE VIEW vote_view AS
SELECT
  v.id AS vote_id,
  v.year,
  r.name AS round,
  vt.name AS vote_type,
  v.points,
  vc.name AS voting_country,
  c.name AS country,
  vc.code AS voting_country_code,
  c.code AS country_code, 
  vc.id AS voting_country_id,
  c.id AS country_id
FROM vote v
JOIN round r ON v.round_id = r.id
JOIN vote_type vt ON v.vote_type_id = vt.id
JOIN country vc ON v.voting_country_id = vc.id
JOIN country c ON v.country_id = c.id;


-- this represents the rank and total points of each country for each contest round per year

 -- this represents the rank and total points of each country for each contest round per year

CREATE OR REPLACE VIEW vote_rank_view AS 
SELECT
  fr.year, 
  fr.country_id, 
  sv.country, 
  'Final' AS round, 
  sv.artist_id,
  sv.artist, 
  sv.song_id, 
  sv.song,
  coalesce(SUM(vv.points), 0) AS total_points,
  fr.place AS final_place,
  fr.running_order AS final_running_order
FROM song_view sv
LEFT JOIN vote_view vv ON sv.country_id = vv.country_id AND 
                     	    sv.year = vv.year AND 
						              vv.round = 'Final'
JOIN finals_result fr ON fr.song_id = sv.song_id 
GROUP BY 
  fr.year, 
  fr.country_id, 
  sv.country, 
  sv.artist_id,
  sv.artist, 
  sv.song_id, 
  sv.song,
  fr.place,
  fr.running_order;