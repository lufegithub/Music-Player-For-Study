-- =============================================================
-- Dados iniciais genéricos (faixas não são criadas aqui porque
-- dependem de arquivos de áudio reais; envie-as pela interface).
-- =============================================================

USE music_player;

INSERT IGNORE INTO genres (name) VALUES
  ('Rock'), ('Pop'), ('Jazz'), ('Blues'), ('Eletrônica'),
  ('Hip-Hop'), ('MPB'), ('Samba'), ('Clássica'), ('Outro');

INSERT IGNORE INTO artists (name, bio) VALUES
  ('Artista Desconhecido', 'Usado quando a faixa não possui artista informado.');

INSERT INTO playlists (name, description)
SELECT 'Favoritas', 'Playlist de exemplo'
WHERE NOT EXISTS (SELECT 1 FROM playlists WHERE name = 'Favoritas');
