package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"path/filepath"

	_ "github.com/lib/pq"

	"github.com/rs/cors"
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

func main() {
	// Create a new CORS handler
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"}, // Todo: Change this in production
		AllowCredentials: true,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		Debug:            true,
	})

	// Initialize the database connection pool here
	db, err := sql.Open("postgres", getDBConnectionString())
	if err != nil {
		log.Fatal("Error connecting to database: ", err)
	}
	defer db.Close()

	// ----- ENDPOINTS -----
	http.HandleFunc("/login", func(w http.ResponseWriter, r *http.Request) {
		Signin(w, r, db)
	})
	http.HandleFunc("/refresh", Refresh)
	http.HandleFunc("/logout", Logout)

	//temp
	http.HandleFunc("/all", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			// Handle GET request
			data, err := ioutil.ReadFile("db/data.json")
			if err != nil {
				http.Error(w, "Error reading data", http.StatusInternalServerError)
				return
			}
			var result map[string]interface{}
			if err := json.Unmarshal(data, &result); err != nil {
				http.Error(w, "Error decoding data", http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(result)
		/*case http.MethodPost:
		// Handle POST request
		var inputData map[string]interface{}
		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "Error reading request body", http.StatusBadRequest)
			return
		}
		if err := json.Unmarshal(body, &inputData); err != nil {
			http.Error(w, "Error decoding request body", http.StatusBadRequest)
			return
		}
		newData, err := json.Marshal(inputData)
		if err != nil {
			http.Error(w, "Error encoding data", http.StatusInternalServerError)
			return
		}
		err = ioutil.WriteFile("db/data.json", newData, 0644)
		if err != nil {
			http.Error(w, "Error writing data", http.StatusInternalServerError)
			return
		}
		fmt.Fprintln(w, "Data written successfully")*/
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	http.Handle("/lists", SessionMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			GetListsHandler(w, r, db)
		case http.MethodPost:
			AddListHandler(w, r, db)
		case http.MethodDelete:
			DeleteListHandler(w, r, db)
		case http.MethodPut:
			EditListHandler(w, r, db)
		default:
			http.Error(w, "Unsupported HTTP method", http.StatusMethodNotAllowed)
		}
	})))

	http.HandleFunc("/image", GetImageFromStorage)

	http.Handle("/messages", SessionMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			GetMessagesHandler(w, r, db)
		case http.MethodPost:
			AddMessagesHandler(w, r, db)
		case http.MethodDelete:
			DeleteMessagesHandler(w, r, db)
		case http.MethodPut:
			EditMessagesHandler(w, r, db)
		default:
			http.Error(w, "Unsupported HTTP method", http.StatusMethodNotAllowed)
		}
	})))

	http.Handle("/items", SessionMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			GetItemsHandler(w, r, db)
		case http.MethodPost:
			AddItemsHandler(w, r, db)
		case http.MethodDelete:
			DeleteItemsHandler(w, r, db)
		case http.MethodPut:
			EditItemsHandler(w, r, db)
		default:
			http.Error(w, "Unsupported HTTP method", http.StatusMethodNotAllowed)
		}
	})))

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "Wishr API is running!")
	})

	handler := c.Handler(http.DefaultServeMux)
	fmt.Println("API server started on :3001")
	http.ListenAndServe(":3001", handler)
}
