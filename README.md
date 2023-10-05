# Wishr
A place where users can create wish lists and invite others to view, comment, and make marks on the list.<br/> **Vewers** are able to mark themselves as "assigned" to a gift as well as if they have purchased the item. Viewers will also have a place to chat which can help them connect and communicate on gift purchasing plans.<br/>**Creators** will not be able to see any of the markings or discussion and if they are to edit the list, then by default the viewers will be notified.<br/><br/>

This is perfect for avoiding duplicate gifts on birthdays, Christmas, weddings, and more!


# File Structure
The repo contains multiple folders in a monorepo structure which can be explained below:

📂*creative_ideas*
> The birth of the project. Brainstorming and structuring text files as well as rudimentary wire frames of what the product was imagined to look like. 

📂*wishr-ui*
> Contains a dockerized React application. All things front-end are stored here.

📂*wishr-api*
> Contains the dockerized Go code for creating an API. You may see a *db* folder inside of here which is where you will find a file titled "data.json". This was the beginnings of returning test data before the actual *wishr-db* was implemented and may be disregarded.

📂*wishr-db*
> A dockerfile that starts a container with a PostgreSQL image. Also contains a .sql file to initialize our DB with test data.

📂*storage*
> A holding place for starter-images such as the default users that are loaded into the project. We store files such as user profile pictures on the server that this project runs on. Now since the API is in it's own docker container, we use a volume option to "pass through" or share the storage between the container and its host machine -- in this case, we use that storage folder but you could change this to anything on your local computer/host machine.


# The Boring Details
## Design Choice
The monorepo contains the separate components, each dockerized to run as individual services. While these services cannot run on their own and therefore would not be considered microservices, they do make for easy scalablility. This means we can deploy multiple copies of one service such as the API through something like Kubernetes and balance out the user load to each container as needed as the user base grows. Simultaneously, this means that if multiple users share an API and one user crashes it, the users will simply be routed to other running coppies of this service as the broken one repairs itself.

## Showcased Features 🏆
 - Salted/Hashed Password Storage
 - Session Tokens / Session Cookies
 - Token Refresh
 - Session Middleware (for API request authentication)
 - State Persistence (even after user refresh)

## Languages/Technologies
| Tool | Extra Details |
|--|--|
|PostgreSQL  | relational DB structure normalized to 2NF |
|Go / Golang| RESTful API |
|React / ReactJS  | state management, comp[onents, hooks, context providers |
|JavaScript| local storage, cookie management |
|Docker| docker-compose, volumes, services |
|HTML / CSS| raw css |
|Pnpm| reduces disk space and speeds up installations via symlinks |
|Vite| faster development and builds compared to *Create React App* |

# Getting Started

## Installation Prerequisites
 - npm
 - Pnpm
 - Vite
 - Node (>=16.14 preferred)
 - Go
 - Docker (Docker Desktop optional)
 -  Firefox 
 >❗ **IMPORTANT**: Chrome has issues storing cookies from cross-origin and/or localhost ❗

## Deploying

 - Make sure Docker/Docker Desktop is running
 - Open a new terminal and navigate to the main wishr folder
 - `docker-compose down -v --rmi all` (stops and removes docker containers, images, and volumes)
 - `docker-compose up --build` (runs *docker-compose.yml* and rebuilds necessary containers)
 - Open Firefox and navigate to localhost:3000

## After Deploying
Okay, so you've done everything up to this point and finally got it up and running but now what?<br/>Assuming you're looking at the login screen, feel free to create an account and get started.<br/>If, however, you don't want to go through the trouble, then just use the test account below
>Email: easton@gmail.com
>Password: test 


# Contributors

 - Taylor Cyr | [https://github.com/tcyr123](https://github.com/tcyr123)
 - Easton Anderson | [https://github.com/EastonA01](https://github.com/EastonA01)