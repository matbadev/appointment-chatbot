# Appointment chatbot

This [React](https://reactjs.org/)-based chatbot for creating and managing appointments was created during a student project in the informatics master's course at [Karlsruhe University of Applied Sciences](https://www.hs-karlsruhe.de/). The authors are:

- Matthias Bäuerle ([matthias-baeuerle](https://github.com/matthias-baeuerle/)) 
- Nick Nowak ([NDN92](https://github.com/NDN92))
- Iván Victoria Fernández ([ivan-victoria](https://github.com/ivan-victoria))
- Valerian Flamm

## Access project

The chatbot is accessible at: [https://appointment-chatbot.firebaseapp.com/](https://appointment-chatbot.firebaseapp.com/)

## Setup project

To setup the project with it's dependencies, follow these steps:
1. Install Node.JS including the package manager npm from [https://nodejs.org/en/download/](https://nodejs.org/en/download/)
1. Clone the project
1. Install the dependencies by running `npm install` in the project directory

## Start project locally

Run `npm start` to run the app locally in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in the browser. The page will reload if you make edits and you will also see any lint errors in the console.

## Build project

Run `npm run build` to build the app to the `build` folder. This command correctly bundles React in production mode and optimizes the build for best performance. The build is minified and the filenames include the hashes. The app is now ready to be deployed.

## Deploy project

Before deploying the project, you need to install firebase-tools globally using `npm install -g firebase-tools`.
After that you can use `firebase login` to login to your Firebase account which must have publish rights for [appointment-chatbot](https://console.firebase.google.com/project/appointment-chatbot/).

Now you can build the project and deploy it to Firebase hosting by running `npm run build-deploy`.
