# ReflectAI - User-Authenticated Journal & Reflection Assistant

A production-grade, secure journaling web application built with **Google Gemini 3.6 Flash**, **Cloud Firestore**, and **Firebase Authentication**. Users can reflect, brainstorm, and converse through multi-turn dialogues with Gemini, while all entries are cryptographically and structurally isolated to the authenticated user in Cloud Firestore.

---

## Architecture & Tech Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **User Identity** | Firebase Authentication | Federated Google Sign-In with zero plaintext passwords stored. |
| **Backend Database** | Cloud Firestore | Owner-isolated document vault (`/users/{userId}/interactions/{interactionId}`). |
| **AI Processing Engine** | Gemini 3.6 Flash API | Multi-turn conversational reflections, brainstorming, and session distillation. |
| **Secret Management** | Google Secret Manager / Env Vars | Server-only key protection preventing browser exposure. |
| **Backend Runtime** | Node.js Express + TypeScript | Unified full-stack server proxying Gemini requests with model fallback. |
| **Frontend Framework** | React 19 + Tailwind CSS + Lucide Icons | Responsive, accessible, high-contrast dark aesthetic. |

---

## 1. Prerequisites & GCP Setup

Ensure you have the following Google Cloud APIs enabled for your GCP project:
- **Cloud Run API** (`run.googleapis.com`)
- **Secret Manager API** (`secretmanager.googleapis.com`)
- **Cloud Firestore API** (`firestore.googleapis.com`)
- **Google Cloud Build API** (`cloudbuild.googleapis.com`)

```bash
# Set your active GCP project ID
export PROJECT_ID="YOUR_PROJECT_ID"
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
export REGION="asia-southeast1" # or us-central1
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com
```

---

## 2. Secret Management Setup

Create and store the Gemini API key in Google Secret Manager, and grant the Cloud Run runtime service account access:

```bash
# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant the default Cloud Run compute service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Database Security Configuration (Cloud Firestore)

Deploy the owner-bound security rules to ensure mathematical tenant isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User interactions isolated strictly to authenticated owner
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Root user document isolated strictly to owner
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Deploy the rules using Firebase CLI or the automated deploy tool:
```bash
firebase deploy --only firestore:rules
```

---

## 4. Google Cloud Run Deployment Flow

Build and deploy the application to Cloud Run:

```bash
# Deploy to Cloud Run mounting the Secret Manager secret
gcloud run deploy reflect-ai \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --port 3000
```

---

## 5. Required Campaign Labeling for Challenge Verification

Apply the required resource label to register the service for automated challenge verification:

```bash
gcloud run services update reflect-ai \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=$REGION
```

---

## 6. Functional Stability & User Walkthrough Test Cases

Every user process and visible interaction has a corresponding test case below:

### Test Case 1: Unauthenticated Landing Page & OAuth Trigger
1. **Initial State**: Navigate to the root URL `/` without an active session.
2. **Action**: Verify the landing page renders with the brand heading, value propositions, and two buttons: "Continue with Google" and "Guest Preview Mode".
3. **Expectation**: No private dashboard is visible; clicking "Continue with Google" launches the Google Identity popup. Clicking "Guest Preview Mode" signs in using Firebase Anonymous Auth and immediately transitions to the authenticated dashboard.

### Test Case 2: Multi-Turn Journal Reflection with Gemini
1. **Initial State**: Authenticated on the Reflection Canvas (`activeTab: "editor"`).
2. **Action**: Select the mode "Deep Reflection" and enter the prompt: *"I'm feeling uncertain about transitioning to a new engineering role next month."* Press `Ctrl+Enter` or click **Reflect with Gemini**.
3. **Expectation**: 
   - A loading indicator shows while the resilient model fallback queries Gemini.
   - The user message and Gemini response appear chronologically.
   - The interaction is immediately persisted to Cloud Firestore under `/users/{userId}/interactions/{interactionId}`.

### Test Case 3: Conversational Continuation (Turn 2)
1. **Initial State**: Turn 1 rendered with Gemini's initial response.
2. **Action**: Enter a follow-up: *"How can I prepare mentally for the imposter syndrome in the first two weeks?"* Click **Reflect with Gemini**.
3. **Expectation**: Gemini replies contextually with respect to the prior turn. The updated interaction with 2 user turns and 2 model turns updates in Firestore.

### Test Case 4: AI Distillation & Key Takeaways
1. **Initial State**: An active conversation with at least 1 turn.
2. **Action**: Click the **Distill & Summarize** button in the top toolbar.
3. **Expectation**: Gemini summarizes the conversation, generating a concise summary, actionable bullet points, tags, and a detected mood badge, automatically updating the Firestore document.

### Test Case 5: Reflection Vault & Search/Filter
1. **Initial State**: Click the **Vault** navigation tab in the top header.
2. **Action**: Verify the previously created reflection appears in the list with its title, tags, date, and message count.
3. **Sub-Test 5a (Search)**: Type keywords in the search bar. Non-matching entries disappear.
4. **Sub-Test 5b (Mode Filter)**: Click the "Reflection" filter pill.
5. **Sub-Test 5c (Resume)**: Click on the reflection card or "Continue". The reflection loads back into the Editor canvas.

### Test Case 6: Copy & Export Transcript
1. **Initial State**: In either the editor or the Vault card.
2. **Action**: Click the **Copy** / **Copy Transcript** button.
3. **Expectation**: The full dialogue and summary are copied to clipboard; a green check icon confirms the action.

### Test Case 7: Secure Deletion
1. **Initial State**: In the Vault view.
2. **Action**: Click the Trash icon on an entry and confirm the prompt.
3. **Expectation**: The document is deleted from Cloud Firestore (`deleteUserInteraction`), removed from the list, and a confirmation toast appears.

### Test Case 8: Zero-Trust Security Panel
1. **Initial State**: Click the **Security & Cloud** tab in the top header.
2. **Action**: Inspect the rendered security architecture.
3. **Expectation**: Displays the exact `firestore.rules` block, Google Secret Manager setup instructions, and Cloud Run challenge verification commands with single-click copy buttons.

### Test Case 9: Secure Sign-Out
1. **Initial State**: Authenticated session.
2. **Action**: Click the Sign Out icon in the top right corner.
3. **Expectation**: Firebase Auth session is terminated; state resets and user is returned cleanly to the Landing Page.
