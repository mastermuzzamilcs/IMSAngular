# IMSAngular

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.10.

## Setup

```bash
npm ci
cp src/environments/environment.example.ts src/environments/environment.ts
```

Fill `src/environments/environment.ts` with the Firebase web config for this project. That file is gitignored.

`npm start` serves the app at `http://localhost:4200/`. `npm run lint` and `npm run build` are what CI runs on pull requests to `dev` and `master`.

## Firebase

Client config lives in the gitignored environment file. The web API key is still a public client identifier: restrict it in Google Cloud, and protect data with Firestore rules plus App Check.

`firestore.rules` allows reads and writes only for signed-in Firebase users. Do not deploy those rules until login calls Firebase Authentication. The login screen does not do that yet, so deploying them now would block every Firestore call.

App Check starts only when `appCheckSiteKey` is set. Create a reCAPTCHA v3 site key in Firebase App Check, put it in the environment file, and enforce App Check in the Firebase console after traffic looks healthy.

The previous key is still in git history. Rotate it in the Firebase console, then update the local environment file.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
