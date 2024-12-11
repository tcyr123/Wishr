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

	if item.ItemName == "" || isListIdInvalid(item.ListID) {
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

	if isItemIdInvalid(item.ID) {
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

	if isItemIdInvalid(item.ID) {
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
