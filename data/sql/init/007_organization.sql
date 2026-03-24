CREATE TABLE organization (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO organization (org_name) VALUES
('OpenAI'),
('TechCorp'),
('EcoSolutions'),
('HealthPlus');
