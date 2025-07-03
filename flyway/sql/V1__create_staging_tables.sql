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
  conductors TEXT,
  youtube_url TEXT
);

CREATE TABLE staging_result_data (
  year INTEGER,
  country TEXT,
  running_order INTEGER,
  place TEXT
);

-- copy csv data directly to staging tables 
COPY staging_vote_data FROM '/data/eurovision_vote_data.csv' DELIMITER ',' CSV HEADER;
COPY staging_participant_data FROM '/data/eurovision_participant_data.csv' DELIMITER ',' CSV HEADER;
COPY staging_result_data FROM '/data/eurovision_result_data.csv' DELIMITER ',' CSV HEADER;

-- ========= 3. CLEAN AND TRANSFORM DATA =========
-- Clean the 'songwriters' column in the staging_participant_data table.

-- Step 3.1: Remove all bracketed text (e.g., '[|sv|]', '[, c, ]', etc.)
-- We use a regular expression to find and replace any text enclosed in square brackets.
UPDATE staging_participant_data
SET songwriters = regexp_replace(songwriters, '\[.*?\]', '', 'g');

-- Step 3.2: Standardize delimiters to a single pipe '|'.
-- This replaces any commas with pipes to ensure consistency.
UPDATE staging_participant_data
SET songwriters = regexp_replace(songwriters, '\s*,\s*', '|', 'g');

-- Step 3.3: Collapse multiple or spaced-out pipes into a single pipe.
-- This cleans up messes like ' | ' or '||' that can result from the previous step.
UPDATE staging_participant_data
SET songwriters = regexp_replace(songwriters, '\s*\|\s*', '|', 'g');
UPDATE staging_participant_data
SET songwriters = regexp_replace(songwriters, '\|{2,}', '|', 'g');

-- Step 3.4: Remove any leading or trailing pipe delimiters from the cleaned string.
UPDATE staging_participant_data
SET songwriters = trim(both '|' from songwriters);