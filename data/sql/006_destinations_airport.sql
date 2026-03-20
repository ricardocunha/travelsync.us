CREATE TABLE locations_airport (
                                   id INT AUTO_INCREMENT PRIMARY KEY,
                                   location_id INT,
                                   airport_id INT,
                                   is_active BOOLEAN DEFAULT true,
                                   FOREIGN KEY (airport_id) REFERENCES airports(id),
                                   FOREIGN KEY (location_id) REFERENCES locations(id),
                                   UNIQUE KEY unique_location_airport (location_id, airport_id)
);

-- First insert: Exact city matches
INSERT IGNORE INTO locations_airport (location_id, airport_id)
SELECT DISTINCT d.id as location_id, a.id as airport_id
FROM locations d
         JOIN airports a ON LOWER(TRIM(d.name)) = LOWER(TRIM(a.city))
    AND d.country_id = a.country_id
WHERE d.is_active = true
  AND a.name NOT LIKE '%Heliport%';

-- Second insert: Special cases with different city names
INSERT IGNORE INTO locations_airport (location_id, airport_id)
SELECT DISTINCT d.id, a.id
FROM locations d
         JOIN airports a ON d.country_id = a.country_id
WHERE (
    (d.name = 'New York' AND a.city IN ('Queens', 'Jamaica'))
        OR (d.name = 'Tokyo' AND a.city IN ('Narita', 'Haneda'))
        OR (d.name = 'London' AND a.city IN ('Hounslow', 'Gatwick'))
        OR (d.name = 'Paris' AND a.city IN ('Roissy-en-France', 'Orly'))
        OR (d.name = 'São Paulo' AND a.city IN ('Guarulhos', 'Campinas'))
        OR (d.name = 'Moscow' AND a.city IN ('Khimki', 'Domodedovo'))
        OR (d.name = 'Rome' AND a.city IN ('Fiumicino', 'Ciampino'))
        OR (d.name = 'Milan' AND a.city IN ('Malpensa', 'Bergamo'))
        OR (d.name = 'Bangkok' AND a.city IN ('Samut Prakan', 'Don Mueang'))
        OR (d.name = 'Seoul' AND a.city IN ('Incheon', 'Gimpo'))
    )
  AND a.name NOT LIKE '%Heliport%';

-- Third insert: Special cross-border cases
INSERT IGNORE INTO locations_airport (location_id, airport_id)
SELECT DISTINCT d.id, a.id
FROM locations d
         JOIN airports a ON 1=1
WHERE (
          (d.name = 'Basel' AND a.city = 'Mulhouse' AND a.iata_code = 'MLH')
              OR (d.name = 'Copenhagen' AND a.city = 'Malmö' AND a.iata_code = 'CPH')
          );

-- Create indexes for better performance
CREATE INDEX idx_dest_airport_composite ON locations_airport(location_id, airport_id);
CREATE INDEX idx_dest_airport_active ON locations_airport(is_active);
