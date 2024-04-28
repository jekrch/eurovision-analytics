-- a view that aggregates/denormalizes song data
CREATE OR REPLACE VIEW song_view AS
SELECT
  s.year,
  c.name AS country,
  s.broadcaster,
  a.name AS artist,
  s.name AS song,
  s.language,
  STRING_AGG(cp.name, ', ' ORDER BY cp.name) AS songwriters,
  cd.name AS conductor,
  a.id AS artist_id, 
  s.id AS song_id,
  cd.id AS conductor_id
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
  cd.id;