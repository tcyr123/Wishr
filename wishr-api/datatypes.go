package main

type User struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Salt     string `json:"salt"`
	Password string `json:"password"`
	Photo    string `json:"photo"`
}
