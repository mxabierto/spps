/* DATABASE SCHEMA */

drop database if exists karen;
create database karen;

drop user if exists mtorres;
create user mtorres with password 'test';
grant all privileges on database karen to mtorres;

\c karen;
set role mtorres;

drop table if exists usuarios cascade;
create table usuarios (
id serial primary key,
usuario text,
contrasena text,
nombres text,
apellido_paterno text,
apellido_materno text,
email text
);

drop table if exists unidad cascade;
create table unidad (
id serial primary key,
nombre text
);


drop table if exists pae cascade;
create table pae (
    id integer primary key,
    nombre text,
    unidad text
);

drop table if exists ficha cascade;
create table ficha (
id integer primary key,
id_pae integer references pae(id),
nombre text,
objetivo text,
descripcion text,
observaciones text,
periodicidad text,
fuente text,
referencia text
);

drop table if exists jurisdiccion;
create table jurisdiccion(
id integer primary key,
nombre text
);

drop table if exists indicador cascade;
create table indicador(
id serial primary key,
id_ficha integer references ficha(id),
anio varchar(4),
entidad integer,
id_jurisdiccion integer, /*references id_jurisdiccion(id),*/
valor float
);


drop table if exists meta cascade;
create table meta(
id serial primary key,
id_ficha integer references ficha(id),
min float,
max float,
color integer,
anio integer
);
