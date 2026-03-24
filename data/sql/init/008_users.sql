CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    level ENUM('owner','manager','user') NOT NULL,
    organization_id INT,
    city VARCHAR(255),
    default_airport_id INT,
    country_id INT,
    timezone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organization(id),
    FOREIGN KEY (default_airport_id) REFERENCES airports(id),
    FOREIGN KEY (country_id) REFERENCES countries(id)
);
