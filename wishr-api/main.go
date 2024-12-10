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
		AllowedOrigins:   []string{getEnv("ALLOWED_ORIGINS", "http://localhost:*")},
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
	http.HandleFunc("/register", func(w http.ResponseWriter, r *http.Request) {
		Register(w, r, db)
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

	http.HandleFunc("/image", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			GetImageFromStorage(w, r)
		case http.MethodPost:
			SessionMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				SaveUserImage(w, r, db)
			})).ServeHTTP(w, r)
		default:
			http.Error(w, "Unsupported HTTP method", http.StatusMethodNotAllowed)
		}
	})

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

	http.Handle("/listViewer", SessionMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			GetListViewersHandler(w, r, db)
		case http.MethodPost:
			AddListViewerHandler(w, r, db)
		case http.MethodDelete:
			DeleteListViewerHandler(w, r, db)
		default:
			http.Error(w, "Unsupported HTTP method", http.StatusMethodNotAllowed)
		}
	})))

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "Wishr API is running!")
	})

	handler := loggingMiddleware(c.Handler(http.DefaultServeMux))
	fmt.Println("API server started on :3001")
	http.ListenAndServe(":3001", handler)
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("Method: %s, URL: %s, RemoteAddr: %s", r.Method, r.URL.String(), r.RemoteAddr)
		next.ServeHTTP(w, r)
	})
}
