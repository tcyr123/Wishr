package main

import "time"

type User struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Salt     string `json:"salt"`
	Password string `json:"password"`
	Photo    string `json:"photo"`
}

type List struct {
	ID           int       `json:"id"`
	Title        string    `json:"title"`
	Creator      string    `json:"creator"`
	CreationDate time.Time `json:"creation_date"`
}

type Item struct {
	ID              int    `json:"id"`
	ListID          int    `json:"list_id"`
	ItemName        string `json:"item_name"`
	ItemDescription string `json:"item_description"`
	Link            string `json:"link"`
	AssignedUser    string `json:"assigned_user"`
	IsPurchased     bool   `json:"is_purchased"`
}

type Shared struct {
	ListID     int    `json:"list_id"`
	SharedUser string `json:"shared_user"`
}

type Message struct {
	ID        int       `json:"id"`
	ListID    int       `json:"list_id"`
	UserEmail string    `json:"user_email"`
	UserInfo  User      `json:"user_info"`
	Date      time.Time `json:"date"`
	Message   string    `json:"message"`
}
