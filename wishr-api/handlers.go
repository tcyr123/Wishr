package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
)

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
