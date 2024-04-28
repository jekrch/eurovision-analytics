CREATE TABLE country (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS country_name_uidx ON country(name);
CREATE UNIQUE INDEX IF NOT EXISTS country_code_uidx ON country(code);

INSERT INTO country (name, code) VALUES
  ('Albania', 'al'),
  ('Andorra', 'ad'),
  ('Armenia', 'am'),
  ('Australia', 'au'),
  ('Austria', 'at'),
  ('Azerbaijan', 'az'),
  ('Belarus', 'by'),
  ('Belgium', 'be'),
  ('Bulgaria', 'bg'),
  ('Bosnia and Herzegovina', 'ba'),
  ('Croatia', 'hr'),
  ('Cyprus', 'cy'),
  ('Czechia', 'cz'),
  ('Denmark', 'dk'),
  ('Estonia', 'ee'),
  ('Finland', 'fi'),
  ('France', 'fr'),
  ('Georgia', 'ge'),
  ('Germany', 'de'),
  ('Greece', 'gr'),
  ('Hungary', 'hu'),
  ('Iceland', 'is'),
  ('Ireland', 'ie'),
  ('Israel', 'il'),
  ('Italy', 'it'),
  ('Latvia', 'lv'),
  ('Lithuania', 'lt'),
  ('Luxembourg', 'lu'),
  ('Malta', 'mt'),
  ('Moldova', 'md'),
  ('Montenegro', 'me'),
  ('Monaco', 'mc'),
  ('Morocco', 'ma'),
  ('Netherlands', 'nl'),
  ('Norway', 'no'),
  ('Macedonia', 'mk'),
  ('Poland', 'pl'),
  ('Portugal', 'pt'),
  ('Romania', 'ro'),
  ('Russia', 'ru'),
  ('San Marino', 'sm'),
  ('Serbia', 'rs'),
  ('Serbia and Montenegro', 'cs'),
  ('Slovenia', 'si'),
  ('Slovakia', 'sk'),
  ('Spain', 'es'),
  ('Sweden', 'se'),
  ('Switzerland', 'ch'),
  ('Turkey', 'tr'),
  ('Ukraine', 'ua'),
  ('United Kingdom', 'gb'),
  ('Yugoslavia', 'yu'),
  -- note that this is a psuedo country that is included as a voting source 
  -- since the 2023 contest
  ('Rest of World', 'row'); 