import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { environment } from '../environments/environment';

const app = initializeApp(environment.firebase);

if (environment.appCheckSiteKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(environment.appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

export const firestore = getFirestore(app);
export const auth = getAuth(app);
