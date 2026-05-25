CREATE TABLE wards (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    code        VARCHAR(50)  NOT NULL UNIQUE,
    city        VARCHAR(255) NOT NULL,
    state       VARCHAR(255) NOT NULL,
    latitude    DECIMAL(10,8),
    longitude   DECIMAL(11,8),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wards_city ON wards(city);
