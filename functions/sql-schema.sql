-- ================================================
-- Portfolio Website Database Schema
-- ================================================

-- Drop existing tables if they exist (for development)
IF OBJECT_ID('Messages', 'U') IS NOT NULL DROP TABLE Messages;
IF OBJECT_ID('Connections', 'U') IS NOT NULL DROP TABLE Connections;
IF OBJECT_ID('Profiles', 'U') IS NOT NULL DROP TABLE Profiles;

-- ================================================
-- Profiles Table
-- ================================================
CREATE TABLE Profiles (
    UserId INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    Bio NVARCHAR(MAX),
    Skills NVARCHAR(MAX), -- JSON array of skills
    ProfileImageUrl NVARCHAR(512),
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    IsActive BIT NOT NULL DEFAULT 1
);

-- ================================================
-- Connections Table
-- ================================================
CREATE TABLE Connections (
    ConnectionId INT PRIMARY KEY IDENTITY(1,1),
    UserId1 INT NOT NULL,
    UserId2 INT NOT NULL,
    ConnectedAt DATETIME NOT NULL DEFAULT GETDATE(),
    Status NVARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, blocked
    RequestedBy INT NOT NULL, -- Which user initiated the connection
    CONSTRAINT FK_Connections_User1 FOREIGN KEY (UserId1) REFERENCES Profiles(UserId),
    CONSTRAINT FK_Connections_User2 FOREIGN KEY (UserId2) REFERENCES Profiles(UserId),
    CONSTRAINT FK_Connections_RequestedBy FOREIGN KEY (RequestedBy) REFERENCES Profiles(UserId),
    CONSTRAINT CHK_Connections_DifferentUsers CHECK (UserId1 <> UserId2),
    CONSTRAINT CHK_Connections_Status CHECK (Status IN ('pending', 'accepted', 'rejected', 'blocked'))
);

-- ================================================
-- Messages Table
-- ================================================
CREATE TABLE Messages (
    MessageId INT PRIMARY KEY IDENTITY(1,1),
    FromUserId INT NOT NULL,
    ToUserId INT NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    SentAt DATETIME NOT NULL DEFAULT GETDATE(),
    IsRead BIT NOT NULL DEFAULT 0,
    ReadAt DATETIME NULL,
    IsDeleted BIT NOT NULL DEFAULT 0,
    DeletedAt DATETIME NULL,
    CONSTRAINT FK_Messages_FromUser FOREIGN KEY (FromUserId) REFERENCES Profiles(UserId),
    CONSTRAINT FK_Messages_ToUser FOREIGN KEY (ToUserId) REFERENCES Profiles(UserId)
);

-- ================================================
-- Indexes for Performance
-- ================================================

-- Profiles Indexes
CREATE INDEX IX_Profiles_Email ON Profiles(Email);
CREATE INDEX IX_Profiles_IsActive ON Profiles(IsActive);

-- Connections Indexes
CREATE INDEX IX_Connections_UserId1 ON Connections(UserId1);
CREATE INDEX IX_Connections_UserId2 ON Connections(UserId2);
CREATE INDEX IX_Connections_Status ON Connections(Status);
CREATE INDEX IX_Connections_User1_User2 ON Connections(UserId1, UserId2);

-- Messages Indexes
CREATE INDEX IX_Messages_ToUserId ON Messages(ToUserId) WHERE IsDeleted = 0;
CREATE INDEX IX_Messages_FromUserId ON Messages(FromUserId) WHERE IsDeleted = 0;
CREATE INDEX IX_Messages_IsRead ON Messages(IsRead) WHERE IsDeleted = 0;
CREATE INDEX IX_Messages_SentAt ON Messages(SentAt DESC);

-- ================================================
-- Insert Sample Data (Optional - for testing)
-- ================================================

-- Sample Profiles
INSERT INTO Profiles (Name, Email, Bio, Skills) VALUES
('John Doe', 'john.doe@example.com', 'Full-stack developer with 5 years of experience', '["JavaScript", "React", "Node.js", "Azure"]'),
('Jane Smith', 'jane.smith@example.com', 'Frontend specialist passionate about UX', '["React", "TypeScript", "CSS", "Figma"]'),
('Bob Johnson', 'bob.johnson@example.com', 'Cloud architect and DevOps engineer', '["Azure", "Kubernetes", "Terraform", "Docker"]');

-- Sample Connections
INSERT INTO Connections (UserId1, UserId2, Status, RequestedBy) VALUES
(1, 2, 'accepted', 1),
(1, 3, 'pending', 1),
(2, 3, 'accepted', 2);

-- Sample Messages
INSERT INTO Messages (FromUserId, ToUserId, Content, IsRead) VALUES
(1, 2, 'Hi Jane! How are you?', 1),
(2, 1, 'Hey John! Doing great, thanks!', 1),
(1, 2, 'Would you like to collaborate on a project?', 0);

-- ================================================
-- Stored Procedures (Optional - for complex operations)
-- ================================================

-- Get User's Conversations
GO
CREATE OR ALTER PROCEDURE sp_GetUserConversations
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT DISTINCT
        CASE 
            WHEN FromUserId = @UserId THEN ToUserId 
            ELSE FromUserId 
        END AS OtherUserId,
        p.Name AS OtherUserName,
        p.Email AS OtherUserEmail,
        p.ProfileImageUrl,
        (SELECT TOP 1 Content FROM Messages 
         WHERE (FromUserId = @UserId AND ToUserId = OtherUserId) 
            OR (FromUserId = OtherUserId AND ToUserId = @UserId)
         ORDER BY SentAt DESC) AS LastMessage,
        (SELECT TOP 1 SentAt FROM Messages 
         WHERE (FromUserId = @UserId AND ToUserId = OtherUserId) 
            OR (FromUserId = OtherUserId AND ToUserId = @UserId)
         ORDER BY SentAt DESC) AS LastMessageTime,
        (SELECT COUNT(*) FROM Messages 
         WHERE FromUserId = OtherUserId 
           AND ToUserId = @UserId 
           AND IsRead = 0 
           AND IsDeleted = 0) AS UnreadCount
    FROM Messages m
    INNER JOIN Profiles p ON p.UserId = CASE 
        WHEN m.FromUserId = @UserId THEN m.ToUserId 
        ELSE m.FromUserId 
    END
    WHERE (m.FromUserId = @UserId OR m.ToUserId = @UserId)
      AND m.IsDeleted = 0
    ORDER BY LastMessageTime DESC;
END
GO

-- Get Messages Between Two Users
GO
CREATE OR ALTER PROCEDURE sp_GetMessagesBetweenUsers
    @User1Id INT,
    @User2Id INT,
    @PageSize INT = 50,
    @PageNumber INT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        MessageId,
        FromUserId,
        ToUserId,
        Content,
        SentAt,
        IsRead,
        ReadAt
    FROM Messages
    WHERE ((FromUserId = @User1Id AND ToUserId = @User2Id) 
       OR  (FromUserId = @User2Id AND ToUserId = @User1Id))
      AND IsDeleted = 0
    ORDER BY SentAt DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO

-- Mark Messages as Read
GO
CREATE OR ALTER PROCEDURE sp_MarkMessagesAsRead
    @ToUserId INT,
    @FromUserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Messages
    SET IsRead = 1,
        ReadAt = GETDATE()
    WHERE ToUserId = @ToUserId
      AND FromUserId = @FromUserId
      AND IsRead = 0
      AND IsDeleted = 0;
      
    SELECT @@ROWCOUNT AS UpdatedCount;
END
GO

-- ================================================
-- Views (Optional - for reporting)
-- ================================================

-- Active Users View
GO
CREATE OR ALTER VIEW vw_ActiveUsers AS
SELECT 
    UserId,
    Name,
    Email,
    (SELECT COUNT(*) FROM Connections 
     WHERE (UserId1 = p.UserId OR UserId2 = p.UserId) 
       AND Status = 'accepted') AS ConnectionCount,
    (SELECT COUNT(*) FROM Messages 
     WHERE FromUserId = p.UserId OR ToUserId = p.UserId) AS MessageCount,
    CreatedAt
FROM Profiles p
WHERE IsActive = 1;
GO

-- ================================================
-- Grants (Adjust based on your security requirements)
-- ================================================
-- GRANT SELECT, INSERT, UPDATE ON Profiles TO [YourFunctionAppIdentity];
-- GRANT SELECT, INSERT, UPDATE ON Connections TO [YourFunctionAppIdentity];
-- GRANT SELECT, INSERT, UPDATE ON Messages TO [YourFunctionAppIdentity];
-- GRANT EXECUTE ON sp_GetUserConversations TO [YourFunctionAppIdentity];
-- GRANT EXECUTE ON sp_GetMessagesBetweenUsers TO [YourFunctionAppIdentity];
-- GRANT EXECUTE ON sp_MarkMessagesAsRead TO [YourFunctionAppIdentity];

PRINT 'Database schema created successfully!';
