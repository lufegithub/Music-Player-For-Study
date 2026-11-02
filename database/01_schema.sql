-- =============================================================
-- Music Player - schema inicial (genérico, ajuste conforme necessário)
-- Pode ser executado direto no MySQL:  mysql -u root -p < database/01_schema.sql
-- =============================================================

CREATE DATABASE IF NOT EXISTS music_player
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE music_player;

-- -------------------------------------------------------------
-- Artistas
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS artists (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  bio         TEXT NULL,
  image_path  VARCHAR(255) NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_artists_name (name)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- Gêneros
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS genres (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(80) NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_genres_name (name)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- Álbuns
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS albums (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(200) NOT NULL,
  artist_id     INT UNSIGNED NULL,
  release_year  SMALLINT UNSIGNED NULL,
  cover_path    VARCHAR(255) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_albums_title_artist (title, artist_id),
  CONSTRAINT fk_albums_artist FOREIGN KEY (artist_id)
    REFERENCES artists (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- Faixas (somente áudio)
--   audio_path / cover_path são relativos à pasta UPLOAD_DIR
--   Se cover_path for NULL, usa a capa do álbum; se ambos NULL, capa padrão.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tracks (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title             VARCHAR(200) NOT NULL,
  artist_id         INT UNSIGNED NULL,
  album_id          INT UNSIGNED NULL,
  genre_id          INT UNSIGNED NULL,
  track_number      SMALLINT UNSIGNED NULL,
  duration_seconds  INT UNSIGNED NULL,
  audio_path        VARCHAR(255) NOT NULL,
  cover_path        VARCHAR(255) NULL,
  mime_type         VARCHAR(100) NULL,
  file_size         BIGINT UNSIGNED NULL,
  play_count        INT UNSIGNED NOT NULL DEFAULT 0,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_tracks_title (title),
  KEY idx_tracks_artist (artist_id),
  KEY idx_tracks_album (album_id),
  KEY idx_tracks_genre (genre_id),
  CONSTRAINT fk_tracks_artist FOREIGN KEY (artist_id)
    REFERENCES artists (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_tracks_album FOREIGN KEY (album_id)
    REFERENCES albums (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_tracks_genre FOREIGN KEY (genre_id)
    REFERENCES genres (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- Playlists
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS playlists (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  description  VARCHAR(500) NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- Relação N:N playlist <-> faixa (com ordenação)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS playlist_tracks (
  playlist_id  INT UNSIGNED NOT NULL,
  track_id     INT UNSIGNED NOT NULL,
  position     INT UNSIGNED NOT NULL DEFAULT 0,
  added_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (playlist_id, track_id),
  KEY idx_playlist_tracks_position (playlist_id, position),
  CONSTRAINT fk_pt_playlist FOREIGN KEY (playlist_id)
    REFERENCES playlists (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pt_track FOREIGN KEY (track_id)
    REFERENCES tracks (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
