-- Schema for All India Villages API

CREATE TABLE IF NOT EXISTS states (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    state_id INTEGER REFERENCES states(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS sub_districts (
    id SERIAL PRIMARY KEY,
    district_id INTEGER REFERENCES districts(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS villages (
    id SERIAL PRIMARY KEY,
    sub_district_id INTEGER REFERENCES sub_districts(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    pin_code VARCHAR(10)
);

-- Indexes for performance
CREATE INDEX idx_villages_name ON villages(name);
CREATE INDEX idx_sub_districts_name ON sub_districts(name);
CREATE INDEX idx_districts_name ON districts(name);
CREATE INDEX idx_states_name ON states(name);
