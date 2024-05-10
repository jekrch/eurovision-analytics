/*
  Migrate the finals result data to the finals_result table
*/
DO $$ BEGIN
	
	IF NOT EXISTS (SELECT * FROM finals_result) THEN 

		INSERT INTO finals_result(
			year, 
			song_id, 
			country_id, 
			running_order, 
			place
		)
		SELECT 
			srd.year, 
			s.id, 
			c.id,
			srd.running_order, 
			CAST((CASE WHEN srd.place = '"' THEN NULL ELSE srd.place END) AS INTEGER)
		FROM staging_result_data srd
		LEFT JOIN country c ON c.name = 
			CASE WHEN srd.country = 'Czech Republic' 
			THEN 'Czechia' 
			WHEN srd.country = 'North Macedonia' 
			THEN 'Macedonia' 
			ELSE srd.country END
		LEFT JOIN song s ON s.country_id  = c.id AND 
							          s.year = srd.year;
		
	END IF;

END $$;