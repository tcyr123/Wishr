package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	_ "github.com/lib/pq"
)

var (
	host     = getEnv("DB_HOST", "172.17.0.1")
	port     = getEnv("DB_PORT", 5432)
	user     = getEnv("POSTGRES_USER", "apiuser")
	password = getEnv("POSTGRES_PASSWORD", "grespost")
	dbname   = getEnv("POSTGRES_DB", "wishr")
)

func getDBConnectionString() string {
	conString := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable", host, port, user, password, dbname)
	log.Printf("vars are %v", conString)
	return conString
}

func getContentType(filename string) string {
	// Determine the Content-Type based on the file extension
	extention := filepath.Ext(filename)
	switch extention {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	default:
		log.Printf("Serving octet filetype since we could not support: %v", extention)
		return "application/octet-stream" // Default to binary if not recognized
	}
}

func SaveUserImage(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	err := r.ParseMultipartForm(10 << 20) // Limit upload size to 10MB
	if err != nil {
		http.Error(w, "Unable to parse form data", http.StatusBadRequest)
		log.Printf("Error parsing form data: %v", err)
		return
	}

	file, handler, err := r.FormFile("photo")
	if err != nil {
		http.Error(w, "Unable to retrieve the file", http.StatusBadRequest)
		log.Printf("Error retrieving the file: %v", err)
		return
	}
	defer file.Close()

	storagePath := "/storage"
	if _, err := os.Stat(storagePath); os.IsNotExist(err) {
		// Create the directory if it doesn't exist
		err := os.MkdirAll(storagePath, os.ModePerm)
		if err != nil {
			http.Error(w, "Failed to create storage directory", http.StatusInternalServerError)
			log.Printf("Error creating storage directory: %v", err)
			return
		}
	}

	// Generate the file path
	filePath := fmt.Sprintf("%s/%s", storagePath, handler.Filename)

	// Save the file to the storage directory
	dst, err := os.Create(filePath)
	if err != nil {
		http.Error(w, "Unable to save the file", http.StatusInternalServerError)
		log.Printf("Error creating file: %v", err)
		return
	}
	defer dst.Close()

	_, err = io.Copy(dst, file)
	if err != nil {
		http.Error(w, "Unable to write the file", http.StatusInternalServerError)
		log.Printf("Error writing file: %v", err)
		return
	}

	oldFilename := ""
	qry := "SELECT COALESCE(photo, '') from users where email = $1"
	err = db.QueryRow(qry, cookie_email).Scan(&oldFilename)
	if err != nil {
		log.Println("Error with query: ", err)
		http.Error(w, "Error with query", http.StatusInternalServerError)
		return
	}

	//Remove the users old photo to clear space
	if oldFilename != "" {
		oldFilePath := fmt.Sprintf("%s/%s", storagePath, oldFilename)
		removeErr := os.Remove(oldFilePath)
		if removeErr != nil {
			log.Printf("Failed to remove file %s after query error: %v", oldFilePath, removeErr)
		}
	}

	qry = "UPDATE users set photo = $1 where email = $2"
	_, err = db.Exec(qry, handler.Filename, cookie_email)
	if err != nil {
		log.Println("(removing file) Error with query: ", err)
		http.Error(w, "Error with query", http.StatusInternalServerError)
		removeErr := os.Remove(filePath)
		if removeErr != nil {
			log.Printf("Failed to remove file %s after query error: %v", filePath, removeErr)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	response := map[string]string{
		"message": "File uploaded successfully"}
	json.NewEncoder(w).Encode(response)
}

func GetImageFromStorage(w http.ResponseWriter, r *http.Request) {
	photoFilename := r.URL.Query().Get("photo")
	storagePath := "/storage"
	imagePath := storagePath + "/" + photoFilename
	if _, err := os.Stat(imagePath); os.IsNotExist(err) {
		files, dirErr := os.ReadDir(storagePath)
		if dirErr != nil {
			log.Printf("Couldnt even list the files in %v. Error: %v", storagePath, dirErr)
		}

		log.Printf("File could not be found: %v . Files are %v", photoFilename, files)
		http.Error(w, "File not found in Wishr", http.StatusNotFound)
		return
	}

	contentType := getContentType(imagePath)

	w.Header().Set("Content-Type", contentType)
	if err := serveFileSafely(w, r, imagePath); err != nil {
		http.Error(w, "Failed to serve file", http.StatusInternalServerError)
		log.Printf("Error serving file: %v", err)
	}
}

func serveFileSafely(w http.ResponseWriter, r *http.Request, path string) error {
	defer func() {
		if err := recover(); err != nil {
			log.Printf("Panic during file serve: %v", err)
		}
	}()
	http.ServeFile(w, r, path)
	return nil
}

func getEnv[T any](key string, fallback T) T {
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
