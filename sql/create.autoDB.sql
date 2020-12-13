-- Database: db_media

-- DROP DATABASE "db_media";

-- CREATE DATABASE "db_media"
--    WITH 
--    OWNER = pi
--    ENCODING = 'UTF8'
--    LC_COLLATE = 'fr_FR.UTF-8'
--    LC_CTYPE = 'fr_FR.UTF-8'
--    TABLESPACE = tbl_autopi
--    CONNECTION LIMIT = -1;

-- Table: public.albumphotos

DROP TABLE public.albumphotos;

CREATE TABLE public.albumphotos
(
    id SERIAL PRIMARY KEY,
    album character varying(64) COLLATE pg_catalog."default"
)
WITH (
    OIDS = FALSE
);

ALTER TABLE public.albumphotos
OWNER to pi;

-- Table: public.albums

DROP TABLE public.albums;

CREATE TABLE public.albums
(
    id SERIAL PRIMARY KEY,
    artistsid smallint,
    nomalbum character varying(128) COLLATE pg_catalog."default",
    date character varying(4) COLLATE pg_catalog."default",
    coverpath character varying(512) COLLATE pg_catalog."default"
)
WITH (
    OIDS = FALSE
);

ALTER TABLE public.albums
OWNER to pi;

-- Table: public.artists

DROP TABLE public.artists;

CREATE TABLE public.artists
(
    id SERIAL PRIMARY KEY,
    nomartist character varying(64) COLLATE pg_catalog."default"
)
WITH (
    OIDS = FALSE
);

ALTER TABLE public.artists
OWNER to pi;

-- Table: public.encours

DROP TABLE public.encours;

CREATE TABLE public.encours
(
    id SERIAL PRIMARY KEY,
    playlist character varying(20) COLLATE pg_catalog."default",
    numpiste smallint
)
WITH (
    OIDS = FALSE
);

ALTER TABLE public.encours
OWNER to pi;

-- Table: public.equalizer

DROP TABLE public.equalizer;

CREATE TABLE public.equalizer
(
    id SERIAL PRIMARY KEY,
    nomequal character varying(8) COLLATE pg_catalog."default",
    defaut character varying(1) COLLATE pg_catalog."default",
    valeurequal character varying(39) COLLATE pg_catalog."default"
)
WITH (
    OIDS = FALSE
);

ALTER TABLE public.equalizer
OWNER to pi;

-- Table: public.jeux

DROP TABLE public.jeux;

CREATE TABLE public.jeux
(
    id SERIAL PRIMARY KEY,
    nomjeux character varying(64) COLLATE pg_catalog."default",
    path character varying(512) COLLATE pg_catalog."default",
    coverpath character varying(512) COLLATE pg_catalog."default",
    emulator character varying(64) COLLATE pg_catalog."default"
)
WITH (
    OIDS = FALSE
);

ALTER TABLE public.jeux
OWNER to pi;

-- Table: public.photos

DROP TABLE public.photos;

CREATE TABLE public.photos
(
    id SERIAL PRIMARY KEY,
    nom character varying(64) COLLATE pg_catalog."default",
    width character varying(8) COLLATE pg_catalog."default",
    height character varying(8) COLLATE pg_catalog."default",
    albumid smallint,
    path character varying(256) COLLATE pg_catalog."default"
)
WITH (
    OIDS = FALSE
);

ALTER TABLE public.photos
OWNER to pi;

-- Table: public.playall

DROP TABLE public.playall;

CREATE TABLE public.playall
(
    id SERIAL PRIMARY KEY,
    titreid smallint
)
WITH (
    OIDS = FALSE
);

ALTER TABLE public.playall
OWNER to pi;

-- Table: public.titres

DROP TABLE public.titres;

CREATE TABLE public.titres
(
    id SERIAL PRIMARY KEY,
    artistsid smallint,
    albumsid smallint,
    nomtitre character varying(128) COLLATE pg_catalog."default",
    piste smallint,
    path character varying(256) COLLATE pg_catalog."default",
    duree real,
    bitrate integer,
    bitrate_mode character varying(8) COLLATE pg_catalog."default",
    stereo character varying(11) COLLATE pg_catalog."default",
    versmpeg real,
    encoder character varying(32) COLLATE pg_catalog."default",
    nbrchannel smallint
)
WITH (
    OIDS = FALSE
);

ALTER TABLE public.titres OWNER to pi;

-- Table: public.videos

DROP TABLE public.videos;

CREATE TABLE public.videos
(
    id SERIAL PRIMARY KEY,
    nomtitre character varying(64) COLLATE pg_catalog."default",
    duree character varying(16) COLLATE pg_catalog."default",
    reprise character varying(9) COLLATE pg_catalog."default",
    path character varying(256) COLLATE pg_catalog."default",
    coverpath character varying(512) COLLATE pg_catalog."default"
)
WITH (
    OIDS = FALSE
);

ALTER TABLE public.videos
OWNER to pi;
