-- Add Users table for authentication
IF OBJECT_ID('Users', 'U') IS NOT NULL DROP TABLE Users;

CREATE TABLE Users (
    UserId INT PRIMARY KEY IDENTITY(1,1),
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Name NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    LastLoginAt DATETIME NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    IsEmailVerified BIT NOT NULL DEFAULT 0
);

-- Index for faster email lookups
CREATE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_Users_IsActive ON Users(IsActive);

-- Update Profiles table to link to Users
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Profiles') AND name = 'UserId')
BEGIN
    ALTER TABLE Profiles ADD UserId INT NULL;
    ALTER TABLE Profiles ADD CONSTRAINT FK_Profiles_Users FOREIGN KEY (UserId) REFERENCES Users(UserId);
    CREATE INDEX IX_Profiles_UserId ON Profiles(UserId);
END
