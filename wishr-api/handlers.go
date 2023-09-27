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
var sessions = map[string]session{} // stores the users sessions. Use redis DB in prod

func (s session) isExpired() bool {
	return s.expiry.Before(time.Now())
}

func SessionMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
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

		userSession, exists := sessions[sessionToken]
		if !exists {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		if userSession.isExpired() {
			delete(sessions, sessionToken)
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

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
	expiresAt := time.Now().Add(600 * time.Second)

	// Set the token in the session map, along with the user it represents
	sessions[sessionToken] = session{
		email:  user.Email,
		expiry: expiresAt,
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
		SameSite: http.SameSiteNoneMode,
	})
	json.NewEncoder(w).Encode(userInfo)
}

func Refresh(w http.ResponseWriter, r *http.Request) {
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

	userSession, exists := sessions[sessionToken]
	if !exists {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	if userSession.isExpired() {
		delete(sessions, sessionToken)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	// If the previous session is valid, create a new session token
	// See signin function for details on how this works
	newSessionToken := uuid.NewString()
	expiresAt := time.Now().Add(600 * time.Second)

	sessions[newSessionToken] = session{
		email:  userSession.email,
		expiry: expiresAt,
	}

	// Delete the older session token
	delete(sessions, sessionToken)

	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    newSessionToken,
		Expires:  time.Now().Add(600 * time.Second),
		SameSite: http.SameSiteNoneMode,
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
		SameSite: http.SameSiteNoneMode,
	})
}

func checkPassword(user User, db *sql.DB) bool {
	var storedSalt string
	var storedPW string
	qry := "SELECT salt, password from USERS where email = $1"
	err := db.QueryRow(qry, user.Email).Scan(&storedSalt, &storedPW)
	if err != nil {
		// if err == sql.ErrNoRows {
		// 	// Can return a custom "No users found with that email"
		// 	return false
		// }
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

// ----- ENDPOINT HANDLERS -----
func GetImageFromStorage(w http.ResponseWriter, r *http.Request) {
	photoFilename := r.URL.Query().Get("photo")
	imagePath := "/storage/" + photoFilename
	contentType := getContentType(imagePath)
	w.Header().Set("Content-Type", contentType)
	http.ServeFile(w, r, imagePath)
}

func GetMessagesHandler(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var messages []Message

	rows, err := db.Query("SELECT m.id, m.list_id, m.user_email, m.date, m.message, u.username, u.photo FROM MESSAGES m join USERS u on m.user_email = u.email")
	if err != nil {
		log.Println("Error with query: ", err)
		http.Error(w, "Error with query", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var m Message
		if err := rows.Scan(&m.ID, &m.ListID, &m.UserEmail, &m.Date, &m.Message, &m.UserInfo.Username, &m.UserInfo.Photo); err != nil {
			log.Println(err)
		}
		messages = append(messages, m)
	}

	json.NewEncoder(w).Encode(messages)
}

func GetItemsHandler(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var items []Item
	//hardcoded list, change later
	qry := "SELECT i.id, i.item_name,  COALESCE(i.item_description, ''),  COALESCE(i.link, ''), i.is_purchased,  COALESCE(i.assigned_user, ''), u.username, COALESCE(u.photo, '') FROM ITEMS i join USERS u on i.assigned_user = u.email WHERE list_id = 1"

	rows, err := db.Query(qry)
	if err != nil {
		log.Println("Error with query: ", err)
		http.Error(w, "Error with query", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var i Item
		if err := rows.Scan(&i.ID, &i.ItemName, &i.ItemDescription, &i.Link, &i.IsPurchased, &i.AssignedUser.Email, &i.AssignedUser.Username, &i.AssignedUser.Photo); err != nil {
			log.Println(err)
		}
		items = append(items, i)
	}

	json.NewEncoder(w).Encode(items)
}
