CREATE TABLE locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country_id INT NOT NULL,
    region_id INT NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    timezone VARCHAR(64) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    FOREIGN KEY (country_id) REFERENCES countries(id),
    FOREIGN KEY (region_id) REFERENCES regions(id)
);

-- Starter curated destination seed based on the PRD examples.
-- Expand this file to the full 70+ destination catalog in a later data pass.
INSERT INTO locations (name, country_id, region_id, latitude, longitude, timezone) VALUES
('New York', (SELECT id FROM countries WHERE name = 'United States'), (SELECT id FROM regions WHERE name = 'North America'), 40.7128000, -74.0060000, 'America/New_York'),
('Toronto', (SELECT id FROM countries WHERE name = 'Canada'), (SELECT id FROM regions WHERE name = 'North America'), 43.6532000, -79.3832000, 'America/Toronto'),
('Miami', (SELECT id FROM countries WHERE name = 'United States'), (SELECT id FROM regions WHERE name = 'North America'), 25.7617000, -80.1918000, 'America/New_York'),
('Vancouver', (SELECT id FROM countries WHERE name = 'Canada'), (SELECT id FROM regions WHERE name = 'North America'), 49.2827000, -123.1207000, 'America/Vancouver'),
('Panama City', (SELECT id FROM countries WHERE name = 'Panama'), (SELECT id FROM regions WHERE name = 'Central America & Caribbean'), 8.9824000, -79.5199000, 'America/Panama'),
('São Paulo', (SELECT id FROM countries WHERE name = 'Brazil'), (SELECT id FROM regions WHERE name = 'South America'), -23.5505000, -46.6333000, 'America/Sao_Paulo'),
('Bogota', (SELECT id FROM countries WHERE name = 'Colombia'), (SELECT id FROM regions WHERE name = 'South America'), 4.7110000, -74.0721000, 'America/Bogota'),
('Buenos Aires', (SELECT id FROM countries WHERE name = 'Argentina'), (SELECT id FROM regions WHERE name = 'South America'), -34.6037000, -58.3816000, 'America/Argentina/Buenos_Aires'),
('London', (SELECT id FROM countries WHERE name = 'United Kingdom'), (SELECT id FROM regions WHERE name = 'Europe'), 51.5072000, -0.1276000, 'Europe/London'),
('Paris', (SELECT id FROM countries WHERE name = 'France'), (SELECT id FROM regions WHERE name = 'Europe'), 48.8566000, 2.3522000, 'Europe/Paris'),
('Dubai', (SELECT id FROM countries WHERE name = 'United Arab Emirates'), (SELECT id FROM regions WHERE name = 'Asia'), 25.2048000, 55.2708000, 'Asia/Dubai'),
('Tokyo', (SELECT id FROM countries WHERE name = 'Japan'), (SELECT id FROM regions WHERE name = 'Asia'), 35.6762000, 139.6503000, 'Asia/Tokyo'),
('Singapore', (SELECT id FROM countries WHERE name = 'Singapore'), (SELECT id FROM regions WHERE name = 'Asia'), 1.3521000, 103.8198000, 'Asia/Singapore'),
('Johannesburg', (SELECT id FROM countries WHERE name = 'South Africa'), (SELECT id FROM regions WHERE name = 'Africa'), -26.2041000, 28.0473000, 'Africa/Johannesburg'),
('Sydney', (SELECT id FROM countries WHERE name = 'Australia'), (SELECT id FROM regions WHERE name = 'Oceania'), -33.8688000, 151.2093000, 'Australia/Sydney');
