CREATE TABLE [dbo].portfolio
(
    profile_id VARCHAR(255) PRIMARY KEY, -- Unique ID for the portfolio
    user_id VARCHAR(255) NOT NULL,       -- Foreign key column
    headline VARCHAR(255),               -- String field for headline
    summary TEXT,                        -- String field for summary
    professional_field VARCHAR(255),     -- String field for field
    is_public BIT DEFAULT 1,      -- Boolean visibility
    updated_at DATETIME2(7) DEFAULT SYSUTCDATETIME(), -- Updated datetime
    -- Define the foreign key constraint
    -- CONSTRAINT fk_user
    --    FOREIGN KEY (user_id) 
    --    REFERENCES users(id)
)


SELECT profile_id, user_id, headline, summary, professional_field
FROM [dbo].portfolio
WHERE summary LIKE '%cloud%';

SELECT * FROM [dbo].portfolio;

INSERT INTO [dbo].portfolio (profile_id, user_id, headline, summary, professional_field, is_public, updated_at)
VALUES
('p1_id_abc', 'u1_id_xyz', 'Experienced Software Engineer', 'A seasoned cloud engineer with 5+ years in full-stack development using Node.js and React.', 'Software Engineering', 1, SYSUTCDATETIME()),
('p2_id_def', 'u2_id_uvw', 'Marketing Manager', 'Creative marketing professional skilled in digital campaigns and social media strategy.', 'Marketing', 1, SYSUTCDATETIME()),
('p3_id_ghi', 'u3_id_rst', 'Graphic Designer', 'Award-winning designer focusing on branding and UI/UX principles.', 'Design', 0, SYSUTCDATETIME()),
('p4_id_jkl', 'u4_id_opq', 'Data Scientist', 'Expert in machine learning, Python, and statistical analysis.', 'Data Science', 1, SYSUTCDATETIME()),
('p5_id_mno', 'u5_id_lmn', 'Project Manager', 'PMP certified manager with a track record of on-time project delivery.', 'Project Management', 1, SYSUTCDATETIME()),
('p6_id_pqr', 'u6_id_ghi', 'Financial Analyst', 'Specialist in corporate finance, budgeting, and forecasting.', 'Finance', 1, SYSUTCDATETIME()),
('p7_id_stu', 'u7_id_def', 'UX Researcher', 'Dedicated to understanding user needs through interviews and usability testing.', 'Design', 0, SYSUTCDATETIME()),
('p8_id_vwx', 'u8_id_abc', 'DevOps Engineer', 'Experienced cloud DevOps engineer with AWS, Docker, Kubernetes, and CI/CD pipelines.', 'Software Engineering', 1, SYSUTCDATETIME()),
('p9_id_yza', 'u9_id_123', 'Content Writer', 'Skilled in SEO optimization, technical writing, and editing.', 'Writing', 1, SYSUTCDATETIME()),
('p10_id_bcd', 'u10_id_456', 'Sales Director', 'Proven success in leading sales teams and achieving revenue targets.', 'Sales', 1, SYSUTCDATETIME());