-- tables 

-- taken from staging_participant_data.artist
CREATE TABLE IF NOT EXISTS artist (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL, 
  wiki_url TEXT
); 

-- taken from the | separated values in staging_participant_data.songwriters
CREATE TABLE IF NOT EXISTS composer (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL
); 

-- from staging_participant_data.conductors
CREATE TABLE IF NOT EXISTS conductor (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL
); 

-- from staging_participant_data.song, song_wikiurl, language, year, country (by fk), artist (by fk)
CREATE TABLE IF NOT EXISTS song (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  language TEXT,
  broadcaster TEXT,
  wiki_url TEXT,
  artist_id BIGINT REFERENCES artist,
  country_id BIGINT REFERENCES country,
  year BIGINT
); 

-- join tables 

CREATE TABLE IF NOT EXISTS song_composer (
  id BIGSERIAL PRIMARY KEY,
  song_id BIGINT REFERENCES song,
  composer_id BIGINT REFERENCES composer
); 

CREATE TABLE IF NOT EXISTS song_conductor (
  id BIGSERIAL primary key,
  song_id BIGINT references song,
  conductor_id BIGINT references conductor
); 


-- indexes

-- country table
CREATE INDEX IF NOT EXISTS country_code_idx ON country (code);

-- artist table
CREATE UNIQUE INDEX artist_name_uidx ON artist (name);

-- composer table
CREATE UNIQUE INDEX composer_name_uidx ON composer (name);

-- conductor table
CREATE UNIQUE INDEX conductor_name_uidx ON conductor (name);

-- song table
CREATE INDEX IF NOT EXISTS song_artist_id_idx ON song (artist_id);
CREATE INDEX IF NOT EXISTS song_country_id_idx ON song (country_id);
CREATE INDEX IF NOT EXISTS song_year_idx ON song (year);

-- song_composer table
CREATE INDEX IF NOT EXISTS song_composer_song_id_idx ON song_composer (song_id);
CREATE INDEX IF NOT EXISTS song_composer_composer_id_idx ON song_composer (composer_id);

-- song_conductor table
CREATE INDEX IF NOT EXISTS song_conductor_song_id_idx ON song_conductor (song_id);
CREATE INDEX IF NOT EXISTS song_conductor_conductor_id_idx ON song_conductor (conductor_id);