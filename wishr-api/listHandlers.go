package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

func GetItemsHandler(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var items []Item

	//Grab List ID From URL Query
	list_id := r.URL.Query().Get("list_id")
	if list_id == "" {
		http.Error(w, "Missing parameters", http.StatusBadRequest)
		return
	}

	//DB Query for Items where list_id = list_id primary key
	qry := "SELECT i.id, i.item_name,  COALESCE(i.item_description, ''),  COALESCE(i.link, ''), i.is_purchased,  COALESCE(i.assigned_user, ''), u.username, COALESCE(u.photo, '') FROM ITEMS i full join USERS u on i.assigned_user = u.email WHERE list_id = $1"

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

func AddItemsHandler(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var item Item
	err := json.NewDecoder(r.Body).Decode(&item)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if item.ItemName == "" || isListIdValid(item.ListID) {
		http.Error(w, "Missing parameters", http.StatusBadRequest)
		return
	}

	qry := "INSERT INTO Items (list_id, item_name, item_description, link, is_purchased) values ($1, $2, $3, $4, FALSE) RETURNING id"

	var insertedID int
	err = db.QueryRow(qry, item.ListID, item.ItemName, item.ItemDescription, item.Link).Scan(&insertedID)
	if err != nil {
		log.Printf("Error executing query: %v", err)
		http.Error(w, "Failed to insert item", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]int{"id": insertedID})
}

func EditItemsHandler(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var item Item
	err := json.NewDecoder(r.Body).Decode(&item)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if isItemIdValid(item.ID) {
		http.Error(w, "Missing parameters", http.StatusBadRequest)
		return
	}

	var queryBuffer bytes.Buffer
	queryBuffer.WriteString("UPDATE Items SET id = id ")

	//dynamic placeholders depending on what we are updating
	var queryParams []interface{}
	paramIndex := 1
	if item.ItemName != "" {
		queryBuffer.WriteString(fmt.Sprintf(", item_name = $%d ", paramIndex))
		queryParams = append(queryParams, item.ItemName)
		paramIndex++
	}
	// more ifs here for other parameters
	if item.ItemDescription != "" {
		queryBuffer.WriteString(fmt.Sprintf(", item_description = $%d ", paramIndex))
		queryParams = append(queryParams, item.ItemDescription)
		paramIndex++
	}
	if item.Link != "" {
		queryBuffer.WriteString(fmt.Sprintf(", link = $%d ", paramIndex))
		queryParams = append(queryParams, item.Link)
		paramIndex++
	}
	if item.IsPurchased != nil {
		queryBuffer.WriteString(fmt.Sprintf(", is_purchased = $%d ", paramIndex))
		queryParams = append(queryParams, *item.IsPurchased)
		paramIndex++
	}
	if item.AssignedUser.Email != "" {
		queryBuffer.WriteString(fmt.Sprintf(", assigned_user = $%d ", paramIndex))
		queryParams = append(queryParams, item.AssignedUser.Email)
		paramIndex++
	}

	// Using user email to verify we aren't updating other' Items
	queryBuffer.WriteString(fmt.Sprintf("WHERE id = $%d ", paramIndex))
	queryParams = append(queryParams, item.ID)
	paramIndex++

	_, err = db.Exec(queryBuffer.String(), queryParams...)
	if err != nil {
		log.Printf("Error executing query: %v", err)
		http.Error(w, "Failed to update message", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func DeleteItemsHandler(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var item Item
	err := json.NewDecoder(r.Body).Decode(&item)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if isItemIdValid(item.ID) {
		http.Error(w, "Missing parameters", http.StatusBadRequest)
		return
	}

	//added a user email check to make sure we cant delete others' Items
	qry := "DELETE FROM items WHERE id = $1 AND id IN (SELECT id FROM lists WHERE creator = $2)"

	_, err = db.Exec(qry, item.ID, cookie_email)
	if err != nil {
		log.Printf("Error executing query: %v", err)
		http.Error(w, "Failed to delete message", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func GetListsHandler(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var lists []Lists

	// Query for shared and owned lists
	qry := "SELECT lists.id, lists.title, lists.creator, lists.creation_date, users.username, CASE WHEN lists.creator = $1 THEN 'creator' WHEN shared.shared_user = $1 THEN 'shared'END AS relationship FROM shared FULL JOIN lists ON lists.id = shared.list_id FULL JOIN users ON users.email = lists.creator WHERE lists.creator = $1 OR shared.shared_user = $1 GROUP BY lists.id, lists.title, lists.creator, lists.creation_date, users.username, relationship ORDER BY relationship, lists.creation_date DESC;"

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

func AddListHandler(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var list List
	err := json.NewDecoder(r.Body).Decode(&list)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if list.Title == "" {
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

	if isListIdValid(list.ID) {
		http.Error(w, "Missing parameters", http.StatusBadRequest)
		return
	}

	var queryBuffer bytes.Buffer
	queryBuffer.WriteString("UPDATE lists SET ")

	//dynamic placeholders depending on what we are updating
	var queryParams []interface{}
	paramIndex := 1
	if list.Title != "" {
		queryBuffer.WriteString(fmt.Sprintf("title = $%d ", paramIndex))
		queryParams = append(queryParams, list.Title)
		paramIndex++
	}
	// more ifs here for other parameters

	// Using user email to verify we aren't updating other' Lists
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

	if isListIdValid(list.ID) {
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

	if isViewerStructValid(viewerDto.SharedUser.Email, viewerDto.ListID) {
		http.Error(w, "Missing parameters", http.StatusBadRequest)
		return
	}

	qry := "INSERT INTO shared (list_id, shared_user) values ($1, $2)"

	_, err2 := db.Exec(qry, viewerDto.ListID, viewerDto.SharedUser.Email)
	// err = db.QueryRow(qry, viewerDto.ListID, viewerDto.SharedUser.Email).Scan(&insertedID)
	if err2 != nil {
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

	if isViewerStructValid(viewerDto.SharedUser.Email, viewerDto.ListID) {
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

// ----- Helper functions -----

func isListIdValid(listId int) bool {
	return listId <= 0
}

func isItemIdValid(itemId int) bool {
	return itemId <= 0
}

func isViewerStructValid(email string, listId int) bool {
	return email == "" || listId <= 0
}
