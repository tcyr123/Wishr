package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"golang.org/x/net/websocket"
)

var (
	clients   = make(map[*websocket.Conn]bool) // Connected clients
	messages  = make(chan string)              // Channel to broadcast messages
	clientMux sync.Mutex                       // Mutex to handle concurrent access to clients map
)

func handleWebSocketMessages(ws *websocket.Conn, r *http.Request, db *sql.DB) {
	// Register the client
	clientMux.Lock()
	clients[ws] = true
	clientMux.Unlock()

	// Remove the client when WebSocket connection is closed
	defer func() {
		clientMux.Lock()
		delete(clients, ws)
		clientMux.Unlock()
		ws.Close()
	}()

	listID := r.URL.Query().Get("list_id")
	if listID == "" {
		log.Println("Missing list_id query parameter")
		ws.Close()
		return
	}

	oldMessages, err := getMessagesFromDB(listID, db)
	if err != nil {
		log.Println("Error loading old messages:", err)
		return
	}

	// Send old messages to the client
	for _, message := range oldMessages {
		wsWrappedMessage := WSMessage[Message]{MessageType: "SEND_MESSAGE", Data: message}
		messageJSON, err := json.Marshal(wsWrappedMessage)
		if err != nil {
			log.Println("Error serializing message:", err)
			continue
		}

		err = websocket.Message.Send(ws, messageJSON)
		if err != nil {
			log.Println("Error sending old message:", err)
			return
		}
	}

	// Receive messages from the client
	for {
		var rawMessage string
		err := websocket.Message.Receive(ws, &rawMessage)
		if err != nil {
			log.Println("Error reading message:", err)
			break
		}

		// Parse the raw message
		var msg WSMessage[Message]
		err = json.Unmarshal([]byte(rawMessage), &msg)
		if err != nil {
			log.Println("Error parsing WebSocket message:", err)
			continue
		}

		if msg.MessageType != "NEW_MESSAGE" {
			continue
		}

		// Store the new message in the database
		_, err = saveMessageToDB(msg.Data, db)
		if err != nil {
			log.Println("Error saving message to DB:", err)
			continue
		}

		msg.MessageType = "SEND_MESSAGE"
		updatedMessage, err := json.Marshal(msg)
		if err != nil {
			log.Println("Error serializing message for broadcast:", err)
			continue
		}

		// Broadcast the message to all connected clients
		messages <- string(updatedMessage)
	}
}

func broadcastMessages() {
	for msg := range messages {
		clientMux.Lock()
		for client := range clients {
			err := websocket.Message.Send(client, msg)
			if err != nil {
				log.Println("Error sending message:", err)
				client.Close()
				delete(clients, client)
			}
		}
		clientMux.Unlock()
	}
}
