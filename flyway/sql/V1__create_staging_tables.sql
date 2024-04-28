CREATE TABLE staging_vote_data (
  year INTEGER,
  round TEXT,
  country TEXT,
  voting_country TEXT,
  vote_type TEXT,
  points INTEGER
);

CREATE TABLE staging_participant_data (
  year INTEGER,
  country TEXT,
  broadcaster TEXT,
  artist TEXT,
  artist_wiki_url TEXT,
  song TEXT,
  song_wiki_url TEXT,
  language TEXT,
  songwriters TEXT,
  conductors TEXT
);

-- copy csv data directly to staging tables
COPY staging_vote_data FROM '/data/eurovision_vote_data.csv' DELIMITER ',' CSV HEADER;
COPY staging_participant_data FROM '/data/eurovision_participant_data.csv' DELIMITER ',' CSV HEADER;