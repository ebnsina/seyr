// Package server wires the HTTP handlers for the ingestor.
package server

import (
	"encoding/json"
	"io"
	"net/http"
	"time"

	"github.com/seyr/ingestor/internal/buffer"
	"github.com/seyr/ingestor/internal/config"
	"github.com/seyr/ingestor/internal/event"
	"github.com/seyr/ingestor/internal/sites"
	"github.com/seyr/ingestor/internal/usage"
)

// maxBodyBytes caps beacon payloads — they are tiny by design.
const maxBodyBytes = 64 * 1024

// Server holds the dependencies the handlers need.
type Server struct {
	buffer         *buffer.Buffer
	sites          *sites.Resolver
	salt           *event.SaltManager
	usage          *usage.Tracker
	blockOverLimit bool
}

// New builds a Server. blockOverLimit toggles hard enforcement (drop over-limit
// events) vs the default soft mode (keep counting; dashboard shows the banner).
func New(
	buf *buffer.Buffer,
	resolver *sites.Resolver,
	salt *event.SaltManager,
	tracker *usage.Tracker,
	blockOverLimit bool,
) *Server {
	return &Server{buffer: buf, sites: resolver, salt: salt, usage: tracker, blockOverLimit: blockOverLimit}
}

// Handler returns the configured HTTP handler (routes + middleware).
func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", s.handleHealth)
	mux.HandleFunc("POST "+config.IngestPath, s.handleIngest)
	mux.HandleFunc("OPTIONS "+config.IngestPath, s.handlePreflight)
	return mux
}

func (s *Server) handleHealth(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"ok":       true,
		"buffered": s.buffer.Len(),
		"dropped":  s.buffer.Dropped(),
	})
}

// Beacons originate from arbitrary customer domains, so CORS is open.
func setCORS(w http.ResponseWriter) {
	h := w.Header()
	h.Set("Access-Control-Allow-Origin", "*")
	h.Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	h.Set("Access-Control-Allow-Headers", "Content-Type")
}

func (s *Server) handlePreflight(w http.ResponseWriter, _ *http.Request) {
	setCORS(w)
	w.WriteHeader(http.StatusNoContent)
}

// handleIngest accepts a beacon. It always replies 202 (even on rejection) so
// clients stay quiet and we don't leak which domains/UAs are filtered. Invalid
// or filtered traffic is simply not buffered.
func (s *Server) handleIngest(w http.ResponseWriter, r *http.Request) {
	setCORS(w)
	defer func() { w.WriteHeader(http.StatusAccepted) }()

	ua := r.Header.Get("User-Agent")
	if event.IsBot(ua) {
		return
	}

	body, err := io.ReadAll(io.LimitReader(r.Body, maxBodyBytes))
	if err != nil {
		return
	}

	var b event.Beacon
	if err := json.Unmarshal(body, &b); err != nil {
		return
	}
	if err := b.Validate(); err != nil {
		return
	}

	site, found, err := s.sites.Resolve(r.Context(), b.D)
	if err != nil || !found {
		return
	}

	// Track month-to-date usage and enforce the org's plan limit.
	now := time.Now()
	count := s.usage.Record(r.Context(), site.OrgID, now)
	overLimit := site.MonthlyLimit > 0 && count > site.MonthlyLimit
	if overLimit && s.blockOverLimit {
		return // hard enforcement: drop without buffering
	}

	row := event.BuildRow(&b, event.RequestContext{
		Header:    r.Header,
		UserAgent: ua,
		Salt:      s.salt.Current(now),
		SiteID:    site.SiteID,
		Now:       now,
	})
	s.buffer.Add(row)
}
