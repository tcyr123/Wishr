package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/rs/cors"
)

func main() {
	// Create a new CORS handler
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"}, // Todo: Change this in production
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"*"},
		Debug:          false,
	})

	//Endpoints
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

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "Wishr API is running!")
	})

	handler := c.Handler(http.DefaultServeMux)
	fmt.Println("API server started on :3001")
	http.ListenAndServe(":3001", handler)
}
