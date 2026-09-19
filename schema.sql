CREATE TABLE IF NOT EXISTS tiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  href TEXT NOT NULL,
  desc TEXT NOT NULL DEFAULT '',
  tag TEXT,
  position INTEGER NOT NULL
);

INSERT INTO tiles (name, href, desc, tag, position) VALUES
  ('MTG Tracker', 'https://mtg.mazzen.dev', 'Metashare tracker for the LGS.', NULL, 0),
  ('RPS', 'https://rps.mazzen.dev', 'Rock, paper, scissors.', NULL, 1),
  ('Show Tracker', 'https://show.mazzen.dev', 'Tracker for whose turn it is to pick the show.', NULL, 2),
  ('Dish', 'https://dish.mazzen.dev', 'Whose turn it is to empty the dishwasher.', NULL, 3),
  ('Guess Who', 'https://guess.mazzen.dev', 'Play Guess Who in person, track your board here.', NULL, 4),
  ('Crane', 'https://crane.mazzen.dev', 'Make your own custom crane.', 'Not working well', 5);
