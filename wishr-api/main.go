package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"

	_ "github.com/lib/pq"

	"github.com/rs/cors"
)

func main() {
	// Create a new CORS handler
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:*"}, // Todo: Change this in production
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

	// Users endpoint to retrieve emails
	http.Handle("/users", SessionMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			GetAllUserEmails(w, r, db)
		default:
			http.Error(w, "Unsupported HTTP method", http.StatusMethodNotAllowed)
		}
	})))

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

	http.Handle("/listSharing", SessionMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			GetListViewersHandler(w, r, db)
		case http.MethodPost:
			AddListViewerHandler(w, r, db)
		case http.MethodDelete:
			DeleteListViewerHandler(w, r, db)
		// case http.MethodPut:
		// 	EditListViewerHandler(w, r, db)
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
