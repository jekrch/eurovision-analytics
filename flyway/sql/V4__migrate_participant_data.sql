-- artists
INSERT INTO artist (name, wiki_url)
SELECT DISTINCT artist, artist_wiki_url
FROM staging_participant_data
ON CONFLICT (name) DO NOTHING;

-- composers
INSERT INTO composer (name)
SELECT DISTINCT unnest(string_to_array(songwriters, '|')) AS name
FROM staging_participant_data
WHERE songwriters IS NOT NULL
ON CONFLICT (name) DO NOTHING;

-- conductors
INSERT INTO conductor (name)
SELECT DISTINCT conductors
FROM staging_participant_data
WHERE conductors IS NOT NULL
ON CONFLICT (name) DO NOTHING;

-- songs
INSERT INTO song (name, language, broadcaster, wiki_url, artist_id, country_id, year)
SELECT DISTINCT
  spd.song,
  spd.language,
  spd.broadcaster,
  spd.song_wiki_url,
  a.id AS artist_id,
  c.id AS country_id,
  spd.year
FROM staging_participant_data spd
JOIN artist a ON spd.artist = a.name
JOIN country c ON spd.country = c.code;

-- song-composer relationships
INSERT INTO song_composer (song_id, composer_id)
SELECT DISTINCT
  s.id AS song_id,
  cp.id AS composer_id
FROM staging_participant_data spd
JOIN song s ON spd.song = s.name AND spd.year = s.year
JOIN composer cp ON cp.name = ANY(string_to_array(spd.songwriters, '|'))
WHERE spd.songwriters IS NOT NULL;

-- song-conductor relationships
INSERT INTO song_conductor (song_id, conductor_id)
SELECT DISTINCT
  s.id AS song_id,
  cd.id AS conductor_id
FROM staging_participant_data spd
JOIN song s ON spd.song = s.name AND spd.year = s.year
JOIN conductor cd ON spd.conductors = cd.name
WHERE spd.conductors IS NOT NULL;