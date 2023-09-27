# Wishr

## todo description of project here. Will do readme last.

## Instructions:
### Running Locally
Use Firefox due to chrome's issues with not setting cookies from cross-origin and/or localhost. Cookies are needed for any request that is not login.
New terminal > cd wishr-api > run go run ./main.go ./datatypes.go > localhost:3001
New terminal > cd wishr-ui > run pnpm run dev > test on localhost:5173

### Running Prod
New terminal > docker-compose down -v --rmi all > docker-compose up --build
