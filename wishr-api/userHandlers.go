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
	"strings"
	"time"
)

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

	sessionToken, expiresAt := createAndStoreToken(user.Email)

	// Get the users data (name and photo reference) from db
	var userInfo UserDTO
	err = db.QueryRow("SELECT email, username, photo, COALESCE(security_question_id, -1) from USERS where email = $1", user.Email).Scan(&userInfo.Email, &userInfo.Username, &userInfo.Photo, &userInfo.SecQId)
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

func Register(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var user User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil || isUserInvalid(user) {
		http.Error(w, "Missing parameters", http.StatusBadRequest)
		return
	}

	salt, err := generateSalt(12)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	qry := "INSERT INTO users (email, username, salt, password, security_question_id) values ($1, $2, $3, $4, $5)"

	_, err = db.Exec(qry, user.Email, user.Username, salt, hashPassword(user.Password, salt), user.SecurityQId)
	if err != nil {
		log.Println("Error with query: ", err)
		http.Error(w, "Error with query", http.StatusInternalServerError)
		return
	}

	// always lowercase entry and check for answers
	secQry := "INSERT INTO SECURITY_ANSWERS (user_email, answer) values ($1, lower($2))"
	_, err = db.Exec(secQry, user.Email, user.SecurityAns)
	if err != nil {
		log.Println("Error with query: ", err)
		http.Error(w, "Error with query", http.StatusInternalServerError)
		return
	}

	sessionToken, expiresAt := createAndStoreToken(user.Email)

	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    sessionToken,
		Expires:  expiresAt,
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
	})

	createdUser := UserDTO{Email: user.Email, Username: user.Username, Photo: ""}
	json.NewEncoder(w).Encode(createdUser)
}

func SecurityQuestions(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var secQs []SecurityQuestion
	qry := "SELECT id, question FROM SECURITY_QUESTIONS"

	rows, err := db.Query(qry)
	if err != nil {
		log.Println("Error with query: ", err)
		http.Error(w, "Error with query", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var q SecurityQuestion
		if err := rows.Scan(&q.Id, &q.Question); err != nil {
			log.Println(err)
		}
		secQs = append(secQs, q)
	}

	json.NewEncoder(w).Encode(secQs)
}

func GetResetPWPrompt(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	email := r.URL.Query().Get("email")
	if email == "" {
		http.Error(w, "Missing parameters", http.StatusBadRequest)
		return
	}

	var question SecurityQuestion
	qry := "SELECT s.id, s.question from security_questions s left outer join users u on s.id=u.security_question_id where u.email = $1"
	err := db.QueryRow(qry, email).Scan(&question.Id, &question.Question)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Forbidden: No security question found for this email", http.StatusForbidden)
			return
		}

		log.Println("Error with query: ", err)
		http.Error(w, "Error with query", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(question)
}

func ResetPassword(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var dto ResetPasswordDTO
	err := json.NewDecoder(r.Body).Decode(&dto)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if dto.SecurityAnswer.Answer == "" || dto.SecurityAnswer.Email == "" || dto.NewPassword == "" || !isValidPw(dto.NewPassword) {
		http.Error(w, "Missing parameters", http.StatusBadRequest)
		return
	}

	var trueAns string
	qry := "SELECT lower(answer) question FROM SECURITY_ANSWERS WHERE user_email = $1"
	err = db.QueryRow(qry, dto.SecurityAnswer.Email).Scan(&trueAns)
	if err != nil {
		log.Println("Error with query: ", err)
		http.Error(w, "Error with query", http.StatusInternalServerError)
		return
	}

	if trueAns != strings.ToLower(dto.SecurityAnswer.Answer) {
		w.WriteHeader(http.StatusForbidden)
		return
	}

	//all good past this point. Set new pw
	salt, err := generateSalt(12)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	updateQry := "UPDATE USERS SET password = $1, salt = $2 WHERE email = $3"
	_, err = db.Exec(updateQry, hashPassword(dto.NewPassword, salt), salt, dto.SecurityAnswer.Email)
	if err != nil {
		log.Println("Error with query: ", err)
		http.Error(w, "Error with query", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusAccepted)
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

	newSessionToken, expiresAt := createAndStoreToken(userSession.Email)

	// Delete the older session token
	time.AfterFunc(10*time.Second, func() {
		delete(sessions, sessionToken)
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    newSessionToken,
		Expires:  expiresAt,
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
