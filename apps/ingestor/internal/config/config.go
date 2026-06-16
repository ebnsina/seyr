// Package config loads ingestor settings from the environment once at startup.
package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

// Config holds all runtime settings for the ingestor.
type Config struct {
	Port            int
	SaltSecret      string
	DatabaseURL     string
	ClickHouseAddr  string // host:port (native protocol)
	ClickHouseDB    string
	ClickHouseUser  string
	ClickHousePass  string
	FlushSize       int
	FlushInterval   time.Duration
	SiteCacheTTL    time.Duration
	ShutdownTimeout time.Duration
}

// IngestPath is the neutral beacon route. Kept deliberately generic so
// signature-based ad-blocker rules have nothing obvious to match. Mirrors
// INGEST_PATH in @seyr/shared.
const IngestPath = "/i"

func env(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}

func envInt(key string, fallback int) int {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return fallback
}

// Load reads configuration from the environment, applying dev-friendly defaults.
func Load() (*Config, error) {
	cfg := &Config{
		Port:            envInt("INGESTOR_PORT", 4000),
		SaltSecret:      env("INGEST_SALT_SECRET", "dev-insecure-salt"),
		DatabaseURL:     env("DATABASE_URL", "postgresql://seyr:seyr@localhost:5432/seyr"),
		ClickHouseAddr:  env("CLICKHOUSE_ADDR", "localhost:9000"),
		ClickHouseDB:    env("CLICKHOUSE_DB", "seyr"),
		ClickHouseUser:  env("CLICKHOUSE_USER", "seyr"),
		ClickHousePass:  env("CLICKHOUSE_PASSWORD", "seyr"),
		FlushSize:       envInt("INGEST_FLUSH_SIZE", 1000),
		FlushInterval:   time.Duration(envInt("INGEST_FLUSH_INTERVAL_MS", 2000)) * time.Millisecond,
		SiteCacheTTL:    time.Duration(envInt("INGEST_SITE_CACHE_TTL_MS", 60000)) * time.Millisecond,
		ShutdownTimeout: 10 * time.Second,
	}
	if cfg.SaltSecret == "" {
		return nil, fmt.Errorf("INGEST_SALT_SECRET must be set")
	}
	return cfg, nil
}
