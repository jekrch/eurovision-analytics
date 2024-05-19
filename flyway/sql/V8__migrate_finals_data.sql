/* Migrate the finals result data to the finals_result table */
DO $$
BEGIN
    IF NOT EXISTS (SELECT * FROM finals_result) THEN
        INSERT INTO finals_result (year, song_id, country_id, running_order, place)
        SELECT srd.year, s.id, c.id, srd.running_order, 
            CASE
                WHEN srd.place ~ '^\d+$' THEN CAST(srd.place AS INTEGER)
                ELSE NULL
            END AS place
        FROM staging_result_data srd
        LEFT JOIN country c ON c.name = CASE
            WHEN srd.country = 'Czech Republic' THEN 'Czechia'
            WHEN srd.country = 'North Macedonia' THEN 'Macedonia'
            ELSE srd.country
        END
        LEFT JOIN song s ON s.country_id = c.id AND s.year = srd.year;
    END IF;
END $$;