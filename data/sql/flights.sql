CREATE TABLE flights
(
    id               SERIAL PRIMARY KEY,
    organization_id    INT          NOT NULL,                                           -- Foreign key to the organization table
    reservation_code VARCHAR(50)  NOT NULL,
    is_departure     BOOLEAN      NOT NULL, -- TRUE for departure, FALSE for arrival
    start_airport    VARCHAR(100) NOT NULL,
    end_airport      VARCHAR(100) NOT NULL,
    time             TIME         NOT NULL,
    air_company      VARCHAR(100) NOT NULL,
    flight_number    VARCHAR(50)  NOT NULL,
    start_date       DATE         NOT NULL,
    end_date         DATE         NOT NULL,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                             -- Timestamp for creation
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_flight_organization FOREIGN KEY (organization_id) REFERENCES organization (id) ON DELETE CASCADE-- Timestamp for updates
);
