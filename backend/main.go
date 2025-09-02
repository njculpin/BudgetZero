package main

import (
	"log"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/helmet"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

// Database models
type User struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Email     string    `json:"email" gorm:"uniqueIndex;not null"`
	Name      string    `json:"name" gorm:"not null"`
	Bio       *string   `json:"bio"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Project struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Title       string    `json:"title" gorm:"not null"`
	Description string    `json:"description"`
	CreatorID   uint      `json:"creator_id" gorm:"not null"`
	Creator     User      `json:"creator" gorm:"foreignKey:CreatorID"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Milestone struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Title       string    `json:"title" gorm:"not null"`
	Description string    `json:"description"`
	OrderIndex  int       `json:"order_index" gorm:"not null"`
	ProjectID   uint      `json:"project_id" gorm:"not null"`
	Project     Project   `json:"project" gorm:"foreignKey:ProjectID"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Invite struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	Code       string    `json:"code" gorm:"uniqueIndex;not null"`
	Status     string    `json:"status" gorm:"default:'active'"`
	MaxUses    int       `json:"max_uses" gorm:"default:1"`
	CurrentUses int      `json:"current_uses" gorm:"default:0"`
	InviterID  uint      `json:"inviter_id" gorm:"not null"`
	Inviter    User      `json:"inviter" gorm:"foreignKey:InviterID"`
	LastUsedAt *time.Time `json:"last_used_at"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type InviteUsage struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	InviteID     uint      `json:"invite_id" gorm:"not null"`
	Invite       Invite    `json:"invite" gorm:"foreignKey:InviteID"`
	InviterID    uint      `json:"inviter_id" gorm:"not null"`
	Inviter      User      `json:"inviter" gorm:"foreignKey:InviterID"`
	InviteeID    uint      `json:"invitee_id" gorm:"not null"`
	Invitee      User      `json:"invitee" gorm:"foreignKey:InviteID"`
	InviteeEmail string    `json:"invitee_email" gorm:"not null"`
	CreatedAt    time.Time `json:"created_at"`
}

// Request/Response structs
type AuthRequest struct {
	Email      string `json:"email"`
	InviteCode string `json:"inviteCode"`
}

type AuthResponse struct {
	User  User   `json:"user"`
	Token string `json:"token"`
}

// Global variables
var db *gorm.DB

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Connect to database
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgresql://nicholasculpin@localhost:5432/budgetzero_dev"
	}

	var err error
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: gormlogger.Default.LogMode(gormlogger.Info), // Enable SQL logging in development
	})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Auto migrate models
	if err := db.AutoMigrate(&User{}, &Project{}, &Milestone{}, &Invite{}, &InviteUsage{}); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// Seed demo data if database is empty
	var userCount int64
	db.Model(&User{}).Count(&userCount)
	if userCount == 0 {
		seedDemoData()
	}

	// Create Fiber app
	app := fiber.New(fiber.Config{
		AppName: "Budget Zero Backend",
	})

	// Middleware
	app.Use(logger.New())
	app.Use(helmet.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE",
	}))

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":    "ok",
			"timestamp": time.Now().Format(time.RFC3339),
		})
	})

	// API routes
	api := app.Group("/api")
	
	// Auth routes
	auth := api.Group("/auth")
	auth.Post("/invite", handleAuthInvite)

	// User routes
	users := api.Group("/users")
	users.Get("/:id", handleGetUser)

	// Project routes
	projects := api.Group("/projects")
	projects.Get("/", handleGetProjects)
	projects.Get("/:id", handleGetProject)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	log.Printf("🚀 Server starting on port %s", port)
	log.Fatal(app.Listen(":" + port))
}

// Handler functions
func handleAuthInvite(c *fiber.Ctx) error {
	var req AuthRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.Email == "" || req.InviteCode == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Email and invite code are required"})
	}

	// Validate invite code
	var invite Invite
	if err := db.Preload("Inviter").Where("code = ? AND status = ? AND current_uses < max_uses", req.InviteCode, "active").First(&invite).Error; err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid or expired invite code"})
	}

	// Find or create user
	var user User
	if err := db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Create new user
			user = User{
				Email: req.Email,
				Name:  req.Email[:len(req.Email)-len("@budgetzero.dev")], // Extract name from email
			}
			if err := db.Create(&user).Error; err != nil {
				return c.Status(500).JSON(fiber.Map{"error": "Failed to create user"})
			}
		} else {
			return c.Status(500).JSON(fiber.Map{"error": "Database error"})
		}
	}

	// Update invite usage
	invite.CurrentUses++
	now := time.Now()
	invite.LastUsedAt = &now
	if err := db.Save(&invite).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update invite"})
	}

	// Create invite usage record
	inviteUsage := InviteUsage{
		InviteID:     invite.ID,
		InviterID:    invite.InviterID,
		InviteeID:    user.ID,
		InviteeEmail: req.Email,
	}
	if err := db.Create(&inviteUsage).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create invite usage record"})
	}

	// Generate JWT token (mock for now)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"exp":     time.Now().Add(7 * 24 * time.Hour).Unix(),
	})

	tokenString, err := token.SignedString([]byte("your-secret-key"))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to generate token"})
	}

	return c.JSON(AuthResponse{
		User:  user,
		Token: tokenString,
	})
}

func handleGetUser(c *fiber.Ctx) error {
	userID := c.Params("id")
	
	var user User
	if err := db.Select("id, email, name, bio, created_at").Where("id = ?", userID).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "User not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}

	return c.JSON(user)
}

func handleGetProjects(c *fiber.Ctx) error {
	creatorID := c.Query("creatorId")
	
	var projects []Project
	query := db.Preload("Creator", "id, name, email")
	
	if creatorID != "" {
		query = query.Where("creator_id = ?", creatorID)
	}
	
	if err := query.Order("created_at DESC").Find(&projects).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch projects"})
	}

	return c.JSON(projects)
}

func handleGetProject(c *fiber.Ctx) error {
	projectID := c.Params("id")
	
	var project Project
	if err := db.Preload("Creator", "id, name, email").
		Preload("Milestones", "order_index ASC").
		Where("id = ?", projectID).
		First(&project).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Project not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch project"})
	}

	return c.JSON(project)
}

// Seed demo data
func seedDemoData() {
	log.Println("🌱 Seeding demo data...")

	// Create demo users
	users := []User{
		{Email: "admin@budgetzero.dev", Name: "Admin User", Bio: stringPtr("Platform administrator")},
		{Email: "creator@budgetzero.dev", Name: "Game Creator", Bio: stringPtr("Professional game designer")},
		{Email: "artist@budgetzero.dev", Name: "Visual Artist", Bio: stringPtr("Creative visual designer")},
		{Email: "writer@budgetzero.dev", Name: "Story Writer", Bio: stringPtr("Narrative specialist")},
	}

	for i := range users {
		if err := db.Create(&users[i]).Error; err != nil {
			log.Printf("Failed to create user %s: %v", users[i].Email, err)
		}
	}

	// Create demo projects
	projects := []Project{
		{
			Title:       "Cosmic Explorers",
			Description: "A space exploration board game where players discover new worlds",
			CreatorID:   users[1].ID,
		},
		{
			Title:       "Dragon Keepers",
			Description: "Fantasy card game about raising and training dragons",
			CreatorID:   users[1].ID,
		},
		{
			Title:       "Steampunk Adventures",
			Description: "Victorian-era adventure game with mechanical contraptions",
			CreatorID:   users[2].ID,
		},
	}

	for i := range projects {
		if err := db.Create(&projects[i]).Error; err != nil {
			log.Printf("Failed to create project %s: %v", projects[i].Title, err)
		}
	}

	// Create demo milestones
	milestones := []Milestone{
		{Title: "Core Mechanics", Description: "Define basic game rules", OrderIndex: 1, ProjectID: projects[0].ID},
		{Title: "Artwork", Description: "Create visual assets", OrderIndex: 2, ProjectID: projects[0].ID},
		{Title: "Rulebook", Description: "Write complete rules", OrderIndex: 3, ProjectID: projects[0].ID},
		{Title: "Production", Description: "Manufacturing setup", OrderIndex: 4, ProjectID: projects[0].ID},
	}

	for i := range milestones {
		if err := db.Create(&milestones[i]).Error; err != nil {
			log.Printf("Failed to create milestone %s: %v", milestones[i].Title, err)
		}
	}

	// Create demo invites
	invites := []Invite{
		{Code: "CREATOR2024", MaxUses: 10, InviterID: users[0].ID},
		{Code: "CONTRIB2024", MaxUses: 50, InviterID: users[0].ID},
		{Code: "VIP2024", MaxUses: 5, InviterID: users[0].ID},
		{Code: "GENERAL2024", MaxUses: 100, InviterID: users[0].ID},
	}

	for i := range invites {
		if err := db.Create(&invites[i]).Error; err != nil {
			log.Printf("Failed to create invite %s: %v", invites[i].Code, err)
		}
	}

	log.Println("✅ Demo data seeded successfully")
}

func stringPtr(s string) *string {
	return &s
}
