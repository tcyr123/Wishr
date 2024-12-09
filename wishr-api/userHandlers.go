package main

import (
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
)

// ----- USER LOGIN AND SESSIONS -----
var sessions = map[string]Session{} // stores the users sessions. Use redis DB in prod
var cookie_email string

func (s Session) isExpired() bool {
	return s.Expiry.Before(time.Now())
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

func Signin(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var user User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	matches := checkPassword(user, db)
	if !matches {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	// Create a new random session token
	sessionToken := uuid.NewString()
	expiresAt := time.Now().Add(120 * time.Second)

	// Set the token in the session map, along with the user it represents
	sessions[sessionToken] = Session{
		Email:  user.Email,
		Expiry: expiresAt,
	}

	// Get the users data (name and photo reference) from db
	var userInfo User
	err = db.QueryRow("SELECT email, username, photo from USERS where email = $1", user.Email).Scan(&userInfo.Email, &userInfo.Username, &userInfo.Photo)
	if err != nil {
		log.Println("Error with query: ", err)
		http.Error(w, "Error with query", http.StatusInternalServerError)
		return
	}

	//encode the user info, set the cookie, and send it all back
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    sessionToken,
		Expires:  expiresAt,
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
	})
	json.NewEncoder(w).Encode(userInfo)
}

func Refresh(w http.ResponseWriter, r *http.Request) {
	c, err := r.Cookie("session_token")
	if err != nil {
		if err == http.ErrNoCookie {
			log.Println("Cookie completely missing on refresh")
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	sessionToken := c.Value

	userSession, exists := sessions[sessionToken]
	if !exists {
		log.Println("userSession missing on refresh")
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	if userSession.isExpired() {
		log.Printf("User Session for %v expired at %v on refresh", userSession.Email, userSession.Expiry)
		delete(sessions, sessionToken)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	// If the previous session is valid, create a new session token
	// See signin function for details on how this works
	newSessionToken := uuid.NewString()
	expiresAt := time.Now().Add(120 * time.Second)

	sessions[newSessionToken] = Session{
		Email:  userSession.Email,
		Expiry: expiresAt,
	}

	// Delete the older session token
	time.AfterFunc(10*time.Second, func() {
		delete(sessions, sessionToken)
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    newSessionToken,
		Expires:  time.Now().Add(120 * time.Second),
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
	})
}

func Logout(w http.ResponseWriter, r *http.Request) {
	c, err := r.Cookie("session_token")
	if err != nil {
		if err == http.ErrNoCookie {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	sessionToken := c.Value

	// remove the users session from the session map
	delete(sessions, sessionToken)

	// return a bad token so user gets booted out
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    "",
		Expires:  time.Now(),
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
	})
}

func checkPassword(user User, db *sql.DB) bool {
	var storedSalt string
	var storedPW string
	qry := "SELECT salt, password from USERS where email = $1"
	err := db.QueryRow(qry, user.Email).Scan(&storedSalt, &storedPW)
	if err != nil {
		log.Println("Error with user login verification:", err)
		return false
	}

	hashedPassword := hashPassword(user.Password, storedSalt)
	return hashedPassword == storedPW
}

func hashPassword(rawPassword, salt string) string {
	saltedPassword := rawPassword + salt
	hash := sha256.Sum256([]byte(saltedPassword))
	return hex.EncodeToString(hash[:])
}

func generateSalt(length int) (string, error) {
	// Create a byte slice to hold the random salt
	salt := make([]byte, length)

	// Generate random bytes for the salt
	_, err := rand.Read(salt)
	if err != nil {
		fmt.Println("Error generating salt:", err)
		return "", err
	}

	// Convert the salt to a hexadecimal string
	saltHex := hex.EncodeToString(salt)

	return saltHex, nil
}

func GetAllUserEmails(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var totalUsers []string

	qry := "SELECT email from USERS"

	rows, err := db.Query(qry)

	if err != nil {
		log.Println("Error with query: ", err)
		http.Error(w, "Error with query", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var m string
		if err := rows.Scan(&m); err != nil {
			log.Println(err)
		}
		totalUsers = append(totalUsers, m)
	}

	json.NewEncoder(w).Encode(totalUsers)
}
