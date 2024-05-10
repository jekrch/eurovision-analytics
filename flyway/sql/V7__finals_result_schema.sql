CREATE TABLE IF NOT EXISTS finals_result (
  id BIGSERIAL PRIMARY KEY,
  year INTEGER,
  song_id BIGINT REFERENCES song,
  country_id BIGINT REFERENCES country,
  running_order INTEGER, 
  place INTEGER
);

CREATE INDEX IF NOT EXISTS finals_result_year ON finals_result(year);
CREATE INDEX IF NOT EXISTS finals_result_song_id ON finals_result(song_id);
CREATE INDEX IF NOT EXISTS finals_result_country_id ON finals_result(country_id);
CREATE INDEX IF NOT EXISTS finals_result_running_order ON finals_result(running_order);
CREATE INDEX IF NOT EXISTS finals_result_place ON finals_result(place);
