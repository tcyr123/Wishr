package main

import "time"

type User struct {
	Username    string `json:"username"`
	Email       string `json:"email"`
	Salt        string `json:"salt"`
	Password    string `json:"password"`
	SecurityQId int    `json:"security_question_id"`
	SecurityAns string `json:"security_answer"`
	Photo       string `json:"photo"`
}

type UserDTO struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Photo    string `json:"photo"`
	SecQId   int    `json:"security_question_id"`
}

type SecurityQuestion struct {
	Id       int    `json:"id"`
	Question string `json:"question"`
}

type SecurityAnswer struct {
	Email  string `json:"email"`
	Answer string `json:"answer"`
}

type ResetPasswordDTO struct {
	SecurityAnswer SecurityAnswer `json:"security_answer"`
	NewPassword    string         `json:"password"`
}

type List struct {
	ID           int       `json:"id"`
	Title        string    `json:"title"`
	Creator      string    `json:"creator"`
	CreationDate time.Time `json:"creation_date"`
}

type Item struct {
	ID              int     `json:"id"`
	ListID          int     `json:"list_id"`
	ItemName        string  `json:"item_name"`
	ItemDescription string  `json:"item_description"`
	Link            string  `json:"link"`
	AssignedUser    UserDTO `json:"assigned_user"`
	IsPurchased     *bool   `json:"is_purchased"`
}

type Shared struct {
	ListID     int    `json:"list_id"`
	SharedUser string `json:"shared_user"`
}

type ViewerDTO struct {
	ListID     int     `json:"list_id"`
	SharedUser UserDTO `json:"shared_user"`
}

type Message struct {
	ID       int       `json:"id"`
	ListID   int       `json:"list_id"`
	UserInfo UserDTO   `json:"user_info"`
	Date     time.Time `json:"date"`
	Message  string    `json:"message"`
}

type Session struct {
	Email  string
	Expiry time.Time
}

type Lists struct {
	ListID       int       `json:"list_id"`
	Title        string    `json:"title"`
	Creator      string    `json:"creator"`
	CreationDate time.Time `json:"creation_date"`
	SharedUser   string    `json:"shared_user"`
	Username     string    `json:"username"`
}

type WSMessage[T any] struct {
	MessageType string `json:"message_type"`
	Data        T      `json:"data"`
}
