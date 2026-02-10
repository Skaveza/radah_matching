CREATE TABLE projects (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  entrepreneur_id BIGINT NOT NULL,
  business_type VARCHAR(50) NOT NULL,
  project_stage VARCHAR(50) NOT NULL,
  industry VARCHAR(100) NOT NULL,
  timeline VARCHAR(50) NOT NULL,
  budget_range VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);