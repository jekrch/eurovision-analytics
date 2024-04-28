-- migrate all vote data from the staging table
DO $$ BEGIN 

  IF NOT EXISTS (SELECT * FROM vote) THEN 

    INSERT INTO vote (
      year, 
      round_id, 
      vote_type_id, 
      voting_country_id, 
      country_id, 
      points
    )
    SELECT
      svd.year,
      r.id AS round_id,
      vt.id AS vote_type_id,
      vc.id AS voting_country_id,
      c.id AS country_id,
      svd.points
    FROM staging_vote_data svd
    LEFT JOIN round r ON r.code = svd.round 
    LEFT JOIN vote_type vt ON vt.code = svd.vote_type 
    LEFT JOIN country c ON c.code = svd.country 
    LEFT JOIN country vc ON vc.code = svd.voting_country;
  
  END IF;
END
$$;