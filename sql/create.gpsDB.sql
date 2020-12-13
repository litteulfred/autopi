-- Database: db_gps

-- DROP DATABASE "db_gps";

-- CREATE DATABASE "db_gps"
--    WITH 
--    OWNER = pi
--    ENCODING = 'UTF8'
--    LC_COLLATE = 'fr_FR.UTF-8'
--    LC_CTYPE = 'fr_FR.UTF-8'
--    TABLESPACE = tbl_autopi
--    CONNECTION LIMIT = -1;

-- Table: public.favoris

DROP TABLE public.favoris;

CREATE TABLE public.favoris
(
    nom character varying(64) COLLATE pg_catalog."default",
    adresse character varying(128) COLLATE pg_catalog."default",
    lat character varying(16) COLLATE pg_catalog."default",
    lon character varying(16) COLLATE pg_catalog."default"
)
WITH (
    OIDS = FALSE
);

ALTER TABLE public.favoris
    OWNER to pi;

-- -------------------------------
-- Table: public.france_city
-- -------------------------------

-- Table: public.france_city

DROP TABLE public.france_city;

CREATE TABLE public.france_city
(
    osm_id bigint,
    name text COLLATE pg_catalog."default",
    place text COLLATE pg_catalog."default",
    departement text COLLATE pg_catalog."default",
    way geometry(Point,3857)
)
WITH (
    OIDS = FALSE
);

ALTER TABLE public.france_city
    OWNER to pi;

-- -------------------------------
-- Table: public.france_ways_all
-- -------------------------------

DROP TABLE public.france_ways_all;

CREATE TABLE public.france_ways_all
(
    gid bigint,
    class_id integer,
    length double precision,
    length_m double precision,
    name text COLLATE pg_catalog."default",
    source bigint,
    target bigint,
    x1 double precision,
    y1 double precision,
    x2 double precision,
    y2 double precision,
    cost double precision,
    reverse_cost double precision,
    cost_s double precision,
    reverse_cost_s double precision,
    rule text COLLATE pg_catalog."default",
    one_way integer,
    maxspeed_forward integer,
    maxspeed_backward integer,
    osm_id bigint,
    source_osm bigint,
    target_osm bigint,
    priority double precision,
    the_geom geometry(LineString,4326),
    toll text COLLATE pg_catalog."default",
    ref text COLLATE pg_catalog."default"
)
WITH (
    OIDS = FALSE
);

ALTER TABLE public.france_ways_all
    OWNER to pi;

-- Index: ways_all_gdx

-- DROP INDEX IF EXISTS public.ways_all_gdx;

CREATE INDEX ways_all_gdx
ON public.france_ways_all USING gist
(the_geom);

-- Index: ways_all_source_idx

-- DROP INDEX public.ways_all_source_idx;

CREATE INDEX ways_all_source_idx
    ON public.france_ways_all USING btree
(source);

-- Index: ways_all_source_osm_idx

-- DROP INDEX public.ways_all_source_osm_idx;

CREATE INDEX ways_all_source_osm_idx
    ON public.france_ways_all USING btree
(source_osm);

-- Index: ways_all_target_idx

-- DROP INDEX public.ways_all_target_idx;

CREATE INDEX ways_all_target_idx
    ON public.france_ways_all USING btree
(target);

-- Index: ways_all_target_osm_idx

-- DROP INDEX public.ways_all_target_osm_idx;

CREATE INDEX ways_all_target_osm_idx
    ON public.france_ways_all USING btree
(target_osm);

-- ---------------------------------------
-- Table: public.france_ways_vertices_pgr
-- ---------------------------------------

DROP TABLE public.france_ways_vertices_pgr;

CREATE TABLE public.france_ways_vertices_pgr
(
    id SERIAL PRIMARY KEY,
    osm_id bigint,
    cnt integer,
    chk integer,
    ein integer,
    eout integer,
    lon numeric(11,8),
    lat numeric(11,8),
    the_geom geometry(Point,4326)
)
WITH (
    OIDS = FALSE
);

ALTER TABLE public.france_ways_vertices_pgr
    OWNER to pi;

-- Index: ways_vertices_pgr_gdx

-- DROP INDEX public.ways_vertices_pgr_gdx;

CREATE INDEX ways_vertices_pgr_gdx
    ON public.france_ways_vertices_pgr USING gist
(the_geom);

-- Index: ways_vertices_pgr_osm_id_idx

-- DROP INDEX public.ways_vertices_pgr_osm_id_idx;

CREATE INDEX ways_vertices_pgr_osm_id_idx
    ON public.france_ways_vertices_pgr USING btree
(osm_id);

-- -----------------------------
-- Table: public.historique_iti
-- -----------------------------

DROP TABLE public.historique_iti;

CREATE TABLE public.historique_iti
(
    date date,
    itineraire character(68) COLLATE pg_catalog."default"
)
WITH (
    OIDS = FALSE
);

ALTER TABLE public.historique_iti
    OWNER to pi;

-- -------------------------
-- Table: public.itineraire
-- -------------------------

DROP TABLE public.itineraire;

CREATE TABLE public.itineraire
(
    id integer,
    ville character(45) COLLATE pg_catalog."default",
    postal character(255) COLLATE pg_catalog."default",
    vertice bigint,
    lon double precision,
    lat double precision,
    the_geom geometry
)
WITH (
    OIDS = FALSE
);

ALTER TABLE public.itineraire
    OWNER to pi;

-- ------------------------------
-- Table: public.osm_way_classes
-- ------------------------------

DROP TABLE public.osm_way_classes;

CREATE TABLE public.osm_way_classes
(
    class_id SERIAL PRIMARY KEY,
    type_id integer,
    name text COLLATE pg_catalog."default",
    priority double precision,
    default_maxspeed integer,
    penalty double precision
)
WITH (
    OIDS = FALSE
);

ALTER TABLE public.osm_way_classes
    OWNER to pi;

-- -----------------------
-- Table: public.paramgps
-- -----------------------

DROP TABLE public.paramgps;

CREATE TABLE public.paramgps
(
    id SERIAL PRIMARY KEY,
    parametre character varying(32) COLLATE pg_catalog."default",
    valeur character varying(32) COLLATE pg_catalog."default",
    type character varying(32) COLLATE pg_catalog."default"
)
WITH (
    OIDS = FALSE
);

ALTER TABLE public.paramgps
    OWNER to pi;

-- ------------------------
-- Table: public.poi_group
-- ------------------------

DROP TABLE public.poi_group;

CREATE TABLE public.poi_group
(
    id SERIAL PRIMARY KEY,
    visible boolean,
    nom character varying(128) COLLATE pg_catalog."default",
    icon character varying(128) COLLATE pg_catalog."default"
)
WITH (
    OIDS = FALSE
);

ALTER TABLE public.poi_group
    OWNER to pi;

-- -----------------------
-- Table: public.poi_list
-- -----------------------

DROP TABLE public.poi_list;

CREATE TABLE public.poi_list
(
    id SERIAL PRIMARY KEY,
    sous_groupid integer,
    lat double precision,
    lon double precision,
    tags character varying(256) COLLATE pg_catalog."default"
)
WITH (
    OIDS = FALSE
);

ALTER TABLE public.poi_list
    OWNER to pi;

-- -----------------------------
-- Table: public.poi_sous_group
-- -----------------------------

DROP TABLE public.poi_sous_group;

CREATE TABLE public.poi_sous_group
(
    id SERIAL PRIMARY KEY,
    groupid integer,
    visible boolean,
    nom character varying(128) COLLATE pg_catalog."default",
    commentaire character varying(256) COLLATE pg_catalog."default",
    icon character varying(128) COLLATE pg_catalog."default"
)
WITH (
    OIDS = FALSE
);

ALTER TABLE public.poi_sous_group
    OWNER to pi;

-- ---------------------------
-- Table: public.routeencours
-- ---------------------------

DROP TABLE public.routeencours;

CREATE TABLE public.routeencours
(
    seq integer,
    path_seq integer,
    node bigint,
    edge bigint,
    cost double precision,
    agg_cost double precision,
    the_geom geometry(LineString,4326)
)
WITH (
    OIDS = FALSE
);

ALTER TABLE public.routeencours
    OWNER to pi;

-- ---------------------------
-- Table: public.speed_camera
-- ---------------------------

DROP TABLE public.speed_camera;

CREATE TABLE public.speed_camera
(
    id character varying(16) COLLATE pg_catalog."default" NOT NULL,
    lat double precision,
    lon double precision,
    maxspeed integer
)
WITH (
    OIDS = FALSE
);

ALTER TABLE public.speed_camera
    OWNER to pi;
