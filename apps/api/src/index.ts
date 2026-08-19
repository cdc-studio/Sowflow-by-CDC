import { initSentry } from "./services/sentry";

initSentry();

import "./functions/health";
import "./functions/extractSow";
import "./functions/projects";
import "./functions/subscriptions";
import "./functions/adminStats";
import "./functions/branding";
import "./functions/transcribeAudio";
import "./functions/tutorials";
