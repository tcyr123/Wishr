package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

func GetListsHandler(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var lists []Lists

	// Query for shared and owned lists
	qry := "SELECT id, title, creator, creation_date, username FROM shared FULL JOIN lists ON lists.id = shared.list_id FULL JOIN users ON users.email = lists.creator WHERE creator = $1 OR shared_user = $1 GROUP BY id, username"

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
		if err := rows.Scan(&l.ListID, &l.Title, &l.Creator, &l.CreationDate, &l.Username); err != nil {
			log.Println(err)
		}
		lists = append(lists, l)
	}

	json.NewEncoder(w).Encode(lists)
}

func AddListHandler(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var list List
	err := json.NewDecoder(r.Body).Decode(&list)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	log.Printf("list is: %v", list)

	if isListTitleInvalid(list.Title) {
		http.Error(w, "Missing parameters", http.StatusBadRequest)
		return
	}

	qry := "INSERT INTO Lists (title, creator, creation_date) values ($1, $2, now()) RETURNING id"

	var insertedID int
	err = db.QueryRow(qry, list.Title, cookie_email).Scan(&insertedID)
	if err != nil {
		log.Printf("Error executing query: %v", err)
		http.Error(w, "Failed to insert list", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]int{"id": insertedID})
}

func EditListHandler(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var list List
	err := json.NewDecoder(r.Body).Decode(&list)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if isListIdInvalid(list.ID) || isListTitleInvalid(list.Title) {
		http.Error(w, "Missing parameters", http.StatusBadRequest)
		return
	}

	var queryBuffer bytes.Buffer
	queryBuffer.WriteString("UPDATE lists SET ")

	//dynamic placeholders depending on what we are updating
	//overkill, but an useful example for bigger entities
	var queryParams []interface{}
	paramIndex := 1
	if list.Title != "" {
		queryBuffer.WriteString(fmt.Sprintf("title = $%d ", paramIndex))
		queryParams = append(queryParams, list.Title)
		paramIndex++
	}
	// more ifs here for other parameters

	queryBuffer.WriteString(fmt.Sprintf("WHERE id = $%d ", paramIndex))
	queryParams = append(queryParams, list.ID)
	paramIndex++
	queryBuffer.WriteString(fmt.Sprintf("AND creator = $%d ", paramIndex))
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

func DeleteListHandler(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var list List
	err := json.NewDecoder(r.Body).Decode(&list)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if isListIdInvalid(list.ID) {
		http.Error(w, "Missing parameters", http.StatusBadRequest)
		return
	}

	//added a user email check to make sure we cant delete others' Lists
	qry := "DELETE FROM Lists WHERE id = $1 and creator = $2"

	_, err = db.Exec(qry, list.ID, cookie_email)
	if err != nil {
		log.Printf("Error executing query: %v", err)
		http.Error(w, "Failed to delete list", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func GetListViewersHandler(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var viewers []ViewerDTO

	//Grab List ID From URL Query
	list_id := r.URL.Query().Get("list_id")
	if list_id == "" {
		http.Error(w, "Missing parameters", http.StatusBadRequest)
		return
	}

	qry := "SELECT list_id, u.email, u.username, u.photo FROM shared s join users u on s.shared_user = u.email WHERE list_id = $1"

	rows, err := db.Query(qry, list_id)
	if err != nil {
		log.Println("Error with query: ", err)
		http.Error(w, "Error with query", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var v ViewerDTO
		if err := rows.Scan(&v.ListID, &v.SharedUser.Email, &v.SharedUser.Username, &v.SharedUser.Photo); err != nil {
			log.Println(err)
		}
		viewers = append(viewers, v)
	}

	json.NewEncoder(w).Encode(viewers)
}

func AddListViewerHandler(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var viewerDto ViewerDTO
	err := json.NewDecoder(r.Body).Decode(&viewerDto)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if isViewerStructInvalid(viewerDto.SharedUser.Email, viewerDto.ListID) {
		http.Error(w, "Missing parameters", http.StatusBadRequest)
		return
	}

	if viewerDto.SharedUser.Email == cookie_email {
		http.Error(w, "Cannot set self as list viewer", http.StatusBadRequest)
		return
	}

	qry := "INSERT INTO shared (list_id, shared_user) values ($1, $2)"

	_, err = db.Exec(qry, viewerDto.ListID, viewerDto.SharedUser.Email)
	if err != nil {
		log.Printf("Error executing query: %v", err)
		http.Error(w, "Failed to insert viewer", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func DeleteListViewerHandler(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var viewerDto ViewerDTO
	err := json.NewDecoder(r.Body).Decode(&viewerDto)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if isViewerStructInvalid(viewerDto.SharedUser.Email, viewerDto.ListID) {
		http.Error(w, "Missing parameters", http.StatusBadRequest)
		return
	}

	qry := "DELETE FROM shared WHERE list_id = $1 AND shared_user = $2"

	_, err = db.Exec(qry, viewerDto.ListID, viewerDto.SharedUser.Email)
	if err != nil {
		log.Printf("Error executing query: %v", err)
		http.Error(w, "Failed to delete viewer", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
