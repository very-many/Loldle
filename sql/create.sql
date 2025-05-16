/* CREATE TABLE champions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    title VARCHAR(100),
    resource VARCHAR(50),
    gender VARCHAR(20),
    attackType VARCHAR(20),
    releaseDate INT,
    skinCount INT
);

CREATE TABLE lanes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE
);

CREATE TABLE species (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE
);

CREATE TABLE genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE
);
CREATE TABLE regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE champion_lanes (
    champion_id VARCHAR(50),
    lane_id INT,
    PRIMARY KEY (champion_id, lane_id),
    FOREIGN KEY (champion_id) REFERENCES champions(id),
    FOREIGN KEY (lane_id) REFERENCES lanes(id)
);

CREATE TABLE champion_species (
    champion_id VARCHAR(50),
    species_id INT,
    PRIMARY KEY (champion_id, species_id),
    FOREIGN KEY (champion_id) REFERENCES champions(id),
    FOREIGN KEY (species_id) REFERENCES species(id)
);

CREATE TABLE champion_genres (
    champion_id VARCHAR(50),
    genre_id INT,
    PRIMARY KEY (champion_id, genre_id),
    FOREIGN KEY (champion_id) REFERENCES champions(id),
    FOREIGN KEY (genre_id) REFERENCES genres(id)
);
CREATE TABLE champion_regions (
    champion_id VARCHAR(50),
    region_id INT,
    PRIMARY KEY (champion_id, region_id),
    FOREIGN KEY (champion_id) REFERENCES champions(id),
    FOREIGN KEY (region_id) REFERENCES regions(id)
); */

CREATE TABLE champions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    title VARCHAR(100),
    resource VARCHAR(50),
    gender VARCHAR(20),
    attackType VARCHAR(20),
    region VARCHAR(100),
    releaseDate INT,
    skinCount INT,
    active BOOLEAN
);

CREATE TABLE lanes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE
);

CREATE TABLE species (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE
);

CREATE TABLE genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE
);
CREATE TABLE regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE champion_lanes (
    champion_id VARCHAR(50),
    lane_id INT,
    PRIMARY KEY (champion_id, lane_id),
    FOREIGN KEY (champion_id) REFERENCES champions(id),
    FOREIGN KEY (lane_id) REFERENCES lanes(id)
);

CREATE TABLE champion_species (
    champion_id VARCHAR(50),
    species_id INT,
    PRIMARY KEY (champion_id, species_id),
    FOREIGN KEY (champion_id) REFERENCES champions(id),
    FOREIGN KEY (species_id) REFERENCES species(id)
);

CREATE TABLE champion_genres (
    champion_id VARCHAR(50),
    genre_id INT,
    PRIMARY KEY (champion_id, genre_id),
    FOREIGN KEY (champion_id) REFERENCES champions(id),
    FOREIGN KEY (genre_id) REFERENCES genres(id)
);
CREATE TABLE champion_regions (
    champion_id VARCHAR(50),
    region_id INT,
    PRIMARY KEY (champion_id, region_id),
    FOREIGN KEY (champion_id) REFERENCES champions(id),
    FOREIGN KEY (region_id) REFERENCES regions(id)
);