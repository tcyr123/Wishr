package main

import (
	"bytes"
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
var cookie_email string

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

		//set a global variable for this requet
		cookie_email = userSession.email

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
		Name:    "session_token",
		Value:   sessionToken,
		Expires: expiresAt,
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
	expiresAt := time.Now().Add(120 * time.Second)

	sessions[newSessionToken] = session{
		email:  userSession.email,
		expiry: expiresAt,
	}

	// Delete the older session token
	delete(sessions, sessionToken)

	http.SetCookie(w, &http.Cookie{
		Name:    "session_token",
		Value:   newSessionToken,
		Expires: time.Now().Add(120 * time.Second),
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
		Name:    "session_token",
		Value:   "",
		Expires: time.Now(),
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

	list_id := r.URL.Query().Get("list_id")
	if list_id == "" {
		http.Error(w, "Missing parameters", http.StatusBadRequest)
		return
	}

	qry := "SELECT m.id, m.list_id, m.user_email, m.date, m.message, u.username, u.photo FROM MESSAGES m join USERS u on m.user_email = u.email WHERE m.list_id = $1"

	rows, err := db.Query(qry, list_id)
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

func AddMessagesHandler(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var message Message
	err := json.NewDecoder(r.Body).Decode(&message)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if message.Message == "" || message.ListID <= 0 {
		http.Error(w, "Missing parameters", http.StatusBadRequest)
		return
	}

	qry := "INSERT INTO MESSAGES (list_id, user_email, date, message) values ($1, $2, now(), $3) RETURNING id"

	var insertedID int
	err = db.QueryRow(qry, message.ListID, cookie_email, message.Message).Scan(&insertedID)
	if err != nil {
		log.Printf("Error executing query: %v", err)
		http.Error(w, "Failed to insert message", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]int{"id": insertedID})
}

func EditMessagesHandler(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var message Message
	err := json.NewDecoder(r.Body).Decode(&message)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if message.ID <= 0 {
		http.Error(w, "Missing parameters", http.StatusBadRequest)
		return
	}

	var queryBuffer bytes.Buffer
	queryBuffer.WriteString("UPDATE MESSAGES SET ")

	//dynamic placeholders depending on what we are updating
	var queryParams []interface{}
	paramIndex := 1
	if message.Message != "" {
		queryBuffer.WriteString(fmt.Sprintf("message = $%d ", paramIndex))
		queryParams = append(queryParams, message.Message)
		paramIndex++
	}
	// more ifs here for other parameters

	// Using user email to verify we aren't updating other' messages
	queryBuffer.WriteString(fmt.Sprintf("WHERE id = $%d ", paramIndex))
	queryParams = append(queryParams, message.ID)
	paramIndex++
	queryBuffer.WriteString(fmt.Sprintf("AND user_email = $%d ", paramIndex))
	queryParams = append(queryParams, cookie_email)
	paramIndex++

	_, err = db.Exec(queryBuffer.String(), queryParams...)
	if err != nil {
		log.Printf("Error executing query: %v", err)
		http.Error(w, "Failed to update message", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func DeleteMessagesHandler(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var message Message
	err := json.NewDecoder(r.Body).Decode(&message)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if message.ID <= 0 {
		http.Error(w, "Missing parameters", http.StatusBadRequest)
		return
	}

	//added a user email check to make sure we cant delete others' messages
	qry := "DELETE FROM MESSAGES WHERE id = $1 and user_email = $2"

	_, err = db.Exec(qry, message.ID, cookie_email)
	if err != nil {
		log.Printf("Error executing query: %v", err)
		http.Error(w, "Failed to insert message", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func GetItemsHandler(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var items []Item

	//Grab List ID From URL Query
	list_id := r.URL.Query().Get("list_id")
	if list_id == "" {
		http.Error(w, "Missing parameters", http.StatusBadRequest)
		return
	}

	//DB Query for Items where list_id = list_id primary key
	qry := "SELECT i.id, i.item_name,  COALESCE(i.item_description, ''),  COALESCE(i.link, ''), i.is_purchased,  COALESCE(i.assigned_user, ''), u.username, COALESCE(u.photo, '') FROM ITEMS i join USERS u on i.assigned_user = u.email WHERE list_id = $1"

	rows, err := db.Query(qry, list_id)
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

func GetListsHandler(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var lists []Lists

	// Query for shared and owned lists
	qry := "SELECT id, title, creator, creation_date, COALESCE(shared_user, ''), username FROM shared FULL JOIN lists ON lists.id = shared.list_id FULL JOIN users ON users.email = lists.creator WHERE creator = $1 OR shared_user = $1"

	// Contains list_id and DB Query. email comes from the request's cookie info
	rows, err := db.Query(qry, cookie_email)
	if err != nil {
		log.Println("Error with query: ", err)
		http.Error(w, "Error with query", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var l Lists
		if err := rows.Scan(&l.ListID, &l.Title, &l.Creator, &l.CreationDate, &l.SharedUser, &l.Username); err != nil {
			log.Println(err)
		}
		lists = append(lists, l)
	}

	json.NewEncoder(w).Encode(lists)
}
