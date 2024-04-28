CREATE TABLE IF NOT EXISTS round (
  id BIGSERIAL PRIMARY KEY,
  code TEXT,
  final boolean DEFAULT false,
  name TEXT 
);

CREATE UNIQUE INDEX IF NOT EXISTS round_name_uidx ON round(name);

-- staging_vote_data.round
INSERT INTO round(name, code, final)
VALUES 							
	('Final', 			'f',   true), 	
	('Semi-Final', 		'sf',  false), 
	('Semi-Final 1', 	'sf1', false), 
	('Semi-Final 2', 	'sf2', false)  	
ON CONFLICT DO NOTHING;


CREATE TABLE IF NOT EXISTS vote_type (
  id BIGSERIAL PRIMARY KEY,
  code TEXT,
  name TEXT 
);

CREATE UNIQUE INDEX IF NOT EXISTS vote_type_name_uidx ON vote_type(name);

-- from from staging_vote_data.vote_type
INSERT INTO vote_type(name, code)
VALUES 				
	('Total', 't'), 
	('Jury', 'j'), 	    
	('Televote', 'tv')  
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS vote (
  id BIGSERIAL PRIMARY KEY,
  year INTEGER,								                  -- staging_vote_data.year
  round_id BIGINT REFERENCES round,			        -- staging_vote_data.round
  vote_type_id BIGINT REFERENCES vote_type,     -- staging_vote_data.vote_type
  voting_country_id BIGINT REFERENCES country,  -- staging_vote_data.voting_country (country.code)
  country_id BIGINT REFERENCES country,		      -- staging_vote_data.country (country.code)
  points INTEGER							                  -- staging_vote_data.points
);

CREATE INDEX IF NOT EXISTS vote_year_idx ON vote(year);
CREATE INDEX IF NOT EXISTS vote_round_id_idx ON vote(round_id);
CREATE INDEX IF NOT EXISTS vote_vote_type_id_idx ON vote(vote_type_id);
CREATE INDEX IF NOT EXISTS vote_voting_country_id_idx ON vote(voting_country_id);
CREATE INDEX IF NOT EXISTS vote_country_id_idx ON vote(country_id);

