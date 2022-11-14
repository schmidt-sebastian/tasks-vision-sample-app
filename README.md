Sample app for @mediapipe/tasks-vision

To use:

- Install Node/NPM/Yarn

```
$ sudo apt update
$ sudo apt install nodejs npm yarn
```
- Clone the repo
- Install package dependencies

```
$ cd sampleapp
$ yarn
```

- Install Firebase CLI if you want to demo with the Firebase emulator 

```
$ npm install -g firebase-tools
```

- Build the sources

```
yarn build
```

- Run the emulator
```
$ firebase emulators:start
```

You should now be able to see the demo at http://localhost:8000/