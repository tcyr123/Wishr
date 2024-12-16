package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
)

func GetMessagesHandler(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var messages []Message

	list_id := r.URL.Query().Get("list_id")
	if list_id == "" {
		http.Error(w, "Missing parameters", http.StatusBadRequest)
		return
	}

	messages, err := getMessagesFromDB(list_id, db)
	if err != nil {
		http.Error(w, "Error with query", http.StatusInternalServerError)
		return
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

	if isMessageInvalid(message) {
		http.Error(w, "Missing parameters", http.StatusBadRequest)
		return
	}

	insertedID, err := saveMessageToDB(message, db)
	if err != nil {
		http.Error(w, "Failed to insert message", http.StatusInternalServerError)
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]int{"id": insertedID})
}

//Advanced features we are not ready for yet
/*
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
		http.Error(w, "Failed to delete message", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
*/

func getMessagesFromDB(listID string, db *sql.DB) ([]Message, error) {
	var messages []Message

	qry := "SELECT m.id, m.list_id, m.user_email, m.date, m.message, u.username, u.photo FROM MESSAGES m join USERS u on m.user_email = u.email WHERE m.list_id = $1"

	rows, err := db.Query(qry, listID)
	if err != nil {
		log.Println("Error with query: ", err)
		return messages, err
	}
	defer rows.Close()

	for rows.Next() {
		var m Message
		if err := rows.Scan(&m.ID, &m.ListID, &m.UserInfo.Email, &m.Date, &m.Message, &m.UserInfo.Username, &m.UserInfo.Photo); err != nil {
			log.Println(err)
		}
		messages = append(messages, m)
	}

	return messages, nil
}

func saveMessageToDB(message Message, db *sql.DB) (int, error) {
	qry := "INSERT INTO MESSAGES (list_id, user_email, message) values ($1, $2, $3) RETURNING id"

	var insertedID int
	err := db.QueryRow(qry, message.ListID, cookie_email, message.Message).Scan(&insertedID)
	if err != nil {
		log.Printf("Error executing query: %v", err)
		return -1, err
	}

	return insertedID, nil
}
