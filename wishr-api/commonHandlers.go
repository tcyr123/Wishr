package main

import (
	"fmt"
	"net/http"
	"path/filepath"

	_ "github.com/lib/pq"
)

const (
	host     = "host.docker.internal"
	port     = 3002
	user     = "apiuser"
	password = "grespost"
	dbname   = "wishr"
)

func getDBConnectionString() string {
	return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable", host, port, user, password, dbname)
}

func getContentType(filename string) string {
	// Determine the Content-Type based on the file extension
	switch filepath.Ext(filename) {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	default:
		return "application/octet-stream" // Default to binary if not recognized
	}
}

func GetImageFromStorage(w http.ResponseWriter, r *http.Request) {
	photoFilename := r.URL.Query().Get("photo")
	imagePath := "/storage/" + photoFilename
	contentType := getContentType(imagePath)
	w.Header().Set("Content-Type", contentType)
	http.ServeFile(w, r, imagePath)
}
