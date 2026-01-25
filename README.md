------------------------------------------------------------

This is HomeCoreOS .

A framework to create your own efficient Home . 

------------------------------------------------------------

## How to Run
1. Clone this repo:
   `git clone https://github.com/feldenserra/homecoreos.git`
2. Modify the .env file to set pws .
3. Run Production with Docker:
   `docker-compose up -d --build`
4. Or Run Local Development:
   `npm run dev`
   Running local dev mode only spawns the database in a docker, allowing your app code to run locally. 

The app will start at http://localhost:3000

