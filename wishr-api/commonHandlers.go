package main

import (
	"fmt"
	"log"
	"os"
	"regexp"
	"strconv"
	"strings"

	_ "github.com/lib/pq"
)

var (
	host     = getEnvVar("DB_HOST", "172.17.0.1")
	port     = getEnvVar("DB_PORT", 5432)
	user     = getEnvVar("POSTGRES_USER", "apiuser")
	password = getEnvVar("POSTGRES_PASSWORD", "grespost")
	dbname   = getEnvVar("POSTGRES_DB", "wishr")
)

func getDBConnectionString() string {
	conString := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable", host, port, user, password, dbname)
	log.Printf("vars are %v", conString)
	return conString
}

func getEnvVar[T any](key string, fallback T) T {
	if value, ok := os.LookupEnv(key); ok {
		// Try to convert the value to the type of fallback
		switch any(fallback).(type) {
		case string:
			return any(value).(T)
		case int:
			if intValue, err := strconv.Atoi(value); err == nil {
				return any(intValue).(T)
			}
		case bool:
			if boolValue, err := strconv.ParseBool(value); err == nil {
				return any(boolValue).(T)
			}
		}
	}
	return fallback
}

func isListIdInvalid(listId int) bool {
	return listId <= 0
}

func isListTitleInvalid(listTitle string) bool {
	return listTitle == ""
}

func isItemIdInvalid(itemId int) bool {
	return itemId <= 0
}

func isViewerStructInvalid(email string, listId int) bool {
	return email == "" || listId <= 0
}

func isMessageInvalid(message Message) bool {
	return message.Message == "" || message.ListID <= 0
}

func isUserInvalid(user User) bool {
	return user.Email == "" || user.Username == "" || user.Password == "" || !isValidPw(user.Password) || user.SecurityQId <= 0 || user.SecurityAns == ""
}

func isValidPw(pw string) bool {
	if len(pw) >= 8 && strings.ContainsAny(pw, "!@#$%^&*") && regexp.MustCompile(`[0-9]`).MatchString(pw) {
		return true
	}
	return false
}
