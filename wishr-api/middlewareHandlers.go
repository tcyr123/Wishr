package main

import (
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"golang.org/x/net/websocket"
)

var sessions = map[string]Session{} // stores the users sessions. Use redis DB in prod
var cookie_email string

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("Method: %s, URL: %s, RemoteAddr: %s", r.Method, r.URL.String(), r.RemoteAddr)
		next.ServeHTTP(w, r)
	})
}

func SessionMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		c, err := r.Cookie("session_token")
		if err != nil {
			if err == http.ErrNoCookie {
				log.Println("Cookie completely missing from request")
				w.WriteHeader(http.StatusUnauthorized)
				return
			}
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		sessionToken := c.Value

		userSession, exists := sessions[sessionToken]
		if !exists {
			log.Printf("Session token %v does not exist", sessionToken)
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		if userSession.isExpired() {
			log.Printf("User Session for %v expired at %v", userSession.Email, userSession.Expiry)
			delete(sessions, sessionToken)
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		//set a global variable for this requet
		cookie_email = userSession.Email

		// Call the next handler in the chain
		next.ServeHTTP(w, r)
	})
}

func WebSocketSessionMiddleware(next func(ws *websocket.Conn, r *http.Request)) websocket.Handler {
	return websocket.Handler(func(ws *websocket.Conn) {
		r := ws.Request()

		// Validate the session token
		c, err := r.Cookie("session_token")
		if err != nil {
			if err == http.ErrNoCookie {
				log.Println("Cookie completely missing from WebSocket request")
				ws.Close()
				return
			}
			log.Println("Invalid WebSocket request due to bad cookie")
			ws.Close()
			return
		}

		sessionToken := c.Value
		userSession, exists := sessions[sessionToken]
		if !exists {
			log.Printf("Session token %v does not exist", sessionToken)
			ws.Close()
			return
		}

		if userSession.isExpired() {
			log.Printf("User Session for %v expired at %v", userSession.Email, userSession.Expiry)
			delete(sessions, sessionToken)
			ws.Close()
			return
		}

		cookie_email = userSession.Email

		next(ws, r)
	})
}

func createAndStoreToken(email string) (string, time.Time) {
	// Create a new random session token
	sessionToken := uuid.NewString()
	expiresAt := time.Now().Add(120 * time.Second)

	// Set the token in the session map, along with the user it represents
	userSesh := Session{
		Email:  email,
		Expiry: expiresAt,
	}
	sessions[sessionToken] = userSesh

	return sessionToken, expiresAt
}

func (s Session) isExpired() bool {
	return s.Expiry.Before(time.Now())
}
