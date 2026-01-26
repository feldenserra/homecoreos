------------------------------------------------------------

This is HomeCoreOS .

A framework to create your own efficient Home . 

------------------------------------------------------------

## How to Run
1. Clone this repo:
   `git clone https://github.com/feldenserra/homecoreos.git`
2. Modify the .env file to set passwords:
3. Run Production with Docker:
   `docker-compose up -d --build`
   You can exclude the mongo-express UI in production by removing that service from the docker-compose.yml file.
4. Or Run Local Development:
   change .env to use dev connection URL, then run:
   `npm run dev`
   Running local dev mode only spawns the database in a docker, allowing your app code to run from your local build.  
   Running dev uses a '_dev' suffix for the DB name to avoid clashing with production data.

The app will start at http://localhost:3000
The mongo-express UI will start at http://localhost:8081


