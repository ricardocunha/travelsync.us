package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Amadeus  AmadeusConfig
	AI       AIConfig
	Agents   AgentsConfig
	Web      WebConfig
}

type ServerConfig struct {
	Host         string
	Port         int
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
}

func (c ServerConfig) Addr() string {
	return fmt.Sprintf("%s:%d", c.Host, c.Port)
}

type DatabaseConfig struct {
	Host string
	Port int
	User string
	Pass string
	Name string
}

func (c DatabaseConfig) DSN() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?parseTime=true", c.User, c.Pass, c.Host, c.Port, c.Name)
}

type AmadeusConfig struct {
	APIKey    string
	APISecret string
	BaseURL   string
}

type AIConfig struct {
	Provider        string
	AnthropicAPIKey string
	OpenAIAPIKey    string
}

type AgentsConfig struct {
	BaseURL string
}

type WebConfig struct {
	AllowedOrigins []string
}

func Load() Config {
	return Config{
		Server: ServerConfig{
			Host:         getEnv("API_HOST", "127.0.0.1"),
			Port:         getEnvInt("API_PORT", 9081),
			ReadTimeout:  getEnvDurationMS("API_READ_TIMEOUT_MS", 5000),
			WriteTimeout: getEnvDurationMS("API_WRITE_TIMEOUT_MS", 10000),
		},
		Database: DatabaseConfig{
			Host: getEnv("DB_HOST", "127.0.0.1"),
			Port: getEnvInt("DB_PORT", 3336),
			User: getEnv("DB_USER", "root"),
			Pass: getEnv("DB_PASS", "root"),
			Name: getEnv("DB_NAME", "trip"),
		},
		Amadeus: AmadeusConfig{
			APIKey:    getEnv("AMADEUS_API_KEY", ""),
			APISecret: getEnv("AMADEUS_API_SECRET", ""),
			BaseURL:   getEnv("AMADEUS_BASE_URL", "https://test.api.amadeus.com"),
		},
		AI: AIConfig{
			Provider:        getEnv("AI_PROVIDER", "claude"),
			AnthropicAPIKey: getEnv("ANTHROPIC_API_KEY", ""),
			OpenAIAPIKey:    getEnv("OPENAI_API_KEY", ""),
		},
		Agents: AgentsConfig{
			BaseURL: getEnv("AGENTS_BASE_URL", "http://127.0.0.1:8000"),
		},
		Web: WebConfig{
			AllowedOrigins: getEnvList(
				"WEB_ALLOWED_ORIGINS",
				[]string{
					"http://127.0.0.1:5173",
					"http://localhost:5173",
					"http://127.0.0.1:4173",
					"http://localhost:4173",
				},
			),
		},
	}
}

func getEnv(key string, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	raw := os.Getenv(key)
	if raw == "" {
		return fallback
	}

	value, err := strconv.Atoi(raw)
	if err != nil {
		return fallback
	}

	return value
}

func getEnvDurationMS(key string, fallbackMS int) time.Duration {
	return time.Duration(getEnvInt(key, fallbackMS)) * time.Millisecond
}

func getEnvList(key string, fallback []string) []string {
	raw := os.Getenv(key)
	if raw == "" {
		return fallback
	}

	values := make([]string, 0, len(fallback))
	for _, item := range strings.Split(raw, ",") {
		trimmed := strings.TrimSpace(item)
		if trimmed != "" {
			values = append(values, trimmed)
		}
	}

	if len(values) == 0 {
		return fallback
	}

	return values
}
