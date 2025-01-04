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
	qry := "SELECT i.id, i.list_id, i.item_name,  COALESCE(i.item_description, '') as desc,  COALESCE(i.link, '') as link, i.is_purchased,  COALESCE(i.assigned_user, '') as asssigned, COALESCE(u.username, '') as user, COALESCE(u.photo, '') as photo FROM ITEMS i full join USERS u on i.assigned_user = u.email WHERE list_id = $1 ORDER BY i.id asc"

	rows, err := db.Query(qry, list_id)
	if err != nil {
		log.Println("Error with query: ", err)
		http.Error(w, "Error with query", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var i Item
		if err := rows.Scan(&i.ID, &i.ListID, &i.ItemName, &i.ItemDescription, &i.Link, &i.IsPurchased, &i.AssignedUser.Email, &i.AssignedUser.Username, &i.AssignedUser.Photo); err != nil {
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
	var isAssumedOwner bool
	err := json.NewDecoder(r.Body).Decode(&item)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if isItemIdInvalid(item.ID) {
		http.Error(w, "Missing parameters", http.StatusBadRequest)
		return
	}

	oldAssigned, _, err := getAssignedItemDetails(db, item)
	if err != nil {
		http.Error(w, "Failed to fetch item details", http.StatusInternalServerError)
		return
	}

	//checking for cookie email to see if user is unassigning themselves
	if oldAssigned != "" && oldAssigned != item.AssignedUser.Email && oldAssigned != cookie_email {
		http.Error(w, "Cannot overwrite a user that is already assigned (try refreshing)", http.StatusBadRequest)
		return
	}

	if *item.IsPurchased && item.AssignedUser.Email == "" {
		http.Error(w, "Cannot mark an unassigned item as purchased (try refreshing)", http.StatusBadRequest)
		return
	}

	var queryBuffer bytes.Buffer
	queryBuffer.WriteString("UPDATE Items SET id = id ")

	//dynamic placeholders depending on what we are updating
	var queryParams []interface{}
	paramIndex := 1
	if item.ItemName != "" {
		isAssumedOwner = true
		queryBuffer.WriteString(fmt.Sprintf(", item_name = $%d ", paramIndex))
		queryParams = append(queryParams, item.ItemName)
		paramIndex++
	}
	if item.ItemDescription != "" {
		isAssumedOwner = true
		queryBuffer.WriteString(fmt.Sprintf(", item_description = $%d ", paramIndex))
		queryParams = append(queryParams, item.ItemDescription)
		paramIndex++
	}
	if item.Link != "" {
		isAssumedOwner = true
		queryBuffer.WriteString(fmt.Sprintf(", link = $%d ", paramIndex))
		queryParams = append(queryParams, item.Link)
		paramIndex++
	}

	var coveredIsPurchased = false
	if item.AssignedUser.Email != "" && oldAssigned == "" {
		isAssumedOwner = false
		queryBuffer.WriteString(fmt.Sprintf(", assigned_user = $%d ", paramIndex))
		queryParams = append(queryParams, item.AssignedUser.Email)
		paramIndex++
	} else if item.AssignedUser.Email == "" && oldAssigned != "" {
		isAssumedOwner = false
		coveredIsPurchased = true
		queryBuffer.WriteString(fmt.Sprintf(", assigned_user = $%d, is_purchased = false ", paramIndex))
		queryParams = append(queryParams, nil)
		paramIndex++
	}

	if item.IsPurchased != nil && !coveredIsPurchased {
		isAssumedOwner = false
		queryBuffer.WriteString(fmt.Sprintf(", is_purchased = $%d ", paramIndex))
		queryParams = append(queryParams, *item.IsPurchased)
		paramIndex++
	}

	queryBuffer.WriteString(fmt.Sprintf("WHERE id = $%d ", paramIndex))
	queryParams = append(queryParams, item.ID)
	paramIndex++

	// Using user email to verify we aren't updating others' Items
	if isAssumedOwner {
		queryBuffer.WriteString(fmt.Sprintf("AND list_id = (SELECT id FROM lists WHERE id = $%d and creator = $%d )", paramIndex, paramIndex+1))
		queryParams = append(queryParams, item.ListID)
		queryParams = append(queryParams, cookie_email)
	}

	_, err = db.Exec(queryBuffer.String(), queryParams...)
	if err != nil {
		log.Printf("Error executing query: %v", err)
		http.Error(w, "Failed to update item", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func getAssignedItemDetails(db *sql.DB, item Item) (string, bool, error) {
	var oldAssigned string
	var oldIsPurchased bool

	checkQry := "SELECT COALESCE(assigned_user, ''), COALESCE(is_purchased, false) FROM items WHERE id = $1"
	err := db.QueryRow(checkQry, item.ID).Scan(&oldAssigned, &oldIsPurchased)
	if err != nil {
		log.Printf("Error executing query: %v", err)
		return oldAssigned, oldIsPurchased, err
	}

	return oldAssigned, oldIsPurchased, nil
}

func DeleteItemsHandler(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var item Item
	err := json.NewDecoder(r.Body).Decode(&item)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if isItemIdInvalid(item.ID) || isListIdInvalid(item.ListID) {
		http.Error(w, "Missing parameters", http.StatusBadRequest)
		return
	}

	//added a user email check to make sure we cant delete others' Items
	qry := "DELETE FROM items WHERE id = $1 AND list_id = (SELECT id FROM lists WHERE id = $2 and creator = $3 )"

	_, err = db.Exec(qry, item.ID, item.ListID, cookie_email)
	if err != nil {
		log.Printf("Error executing query: %v", err)
		http.Error(w, "Failed to delete message", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
