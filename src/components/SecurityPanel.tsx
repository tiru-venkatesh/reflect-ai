import React from "react";
import {
  ShieldCheck,
  Lock,
  Key,
  Server,
  Database,
  CheckCircle,
  Copy,
  Check,
  Terminal,
} from "lucide-react";

export const SecurityPanel: React.FC = () => {
  const [copiedSection, setCopiedSection] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const firestoreRulesSnippet = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User interactions isolated strictly to authenticated owner
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Root user record isolated strictly to owner
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}`;

  const secretManagerSnippet = `# Create and store Gemini API Key in Google Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant Cloud Run runtime service account permission to access the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \\
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \\
  --role="roles/secretmanager.secretAccessor"`;

  const verificationSnippet = `gcloud run services update reflect-ai-service \\
  --update-labels=dev-tutorial=cloud-run-ai-challenge \\
  --region=asia-southeast1`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
      <div className="pb-4 border-b border-stone-800">
        <h2 className="font-serif text-2xl font-semibold text-stone-100 flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Zero-Trust Security &amp; Cloud Architecture</span>
        </h2>
        <p className="text-xs text-stone-400 mt-0.5">
          Comprehensive compliance report mapping threat vectors to production safeguards
        </p>
      </div>

      {/* Security Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Lock className="w-4 h-4" />
            <span>Path-Bound Isolation</span>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed font-sans">
            Data resides strictly under <code className="text-emerald-300 font-mono text-[11px]">/users/&#123;uid&#125;/interactions</code>. 
            Cross-tenant reads or writes are rejected at the database engine level via security rules.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Key className="w-4 h-4" />
            <span>Secret Manager / Server Proxy</span>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed font-sans">
            The Gemini API key is never bundled in frontend JavaScript. All requests route through the backend Express layer (<code className="text-amber-300 font-mono text-[11px]">/api/gemini/*</code>).
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Server className="w-4 h-4" />
            <span>Resilient Fallback Ladder</span>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed font-sans">
            Automated model ladder handles latency or quota spikes (<code className="text-blue-300 font-mono text-[11px]">gemini-3.6-flash</code> &rarr; <code className="text-blue-300 font-mono text-[11px]">gemini-3.1-flash-lite</code> &rarr; <code className="text-blue-300 font-mono text-[11px]">gemini-flash-latest</code>).
          </p>
        </div>
      </div>

      {/* Firestore Rules Block */}
      <div className="rounded-2xl bg-stone-950 border border-stone-800 overflow-hidden">
        <div className="px-4 py-3 bg-stone-900/80 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-stone-300">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>firestore.rules &bull; Zero Insecure Defaults</span>
          </div>
          <button
            onClick={() => copyToClipboard(firestoreRulesSnippet, "rules")}
            className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors flex items-center gap-1 text-xs"
          >
            {copiedSection === "rules" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <pre className="p-4 text-xs font-mono text-emerald-300/90 overflow-x-auto leading-relaxed">
          {firestoreRulesSnippet}
        </pre>
      </div>

      {/* Secret Manager Commands */}
      <div className="rounded-2xl bg-stone-950 border border-stone-800 overflow-hidden">
        <div className="px-4 py-3 bg-stone-900/80 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-stone-300">
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>Secret Manager IAM Provisioning Commands</span>
          </div>
          <button
            onClick={() => copyToClipboard(secretManagerSnippet, "secret")}
            className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors flex items-center gap-1 text-xs"
          >
            {copiedSection === "secret" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <pre className="p-4 text-xs font-mono text-amber-300/90 overflow-x-auto leading-relaxed">
          {secretManagerSnippet}
        </pre>
      </div>

      {/* Challenge Verification Label */}
      <div className="rounded-2xl bg-stone-950 border border-stone-800 overflow-hidden">
        <div className="px-4 py-3 bg-stone-900/80 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-stone-300">
            <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>Required Campaign Labeling for Challenge Verification</span>
          </div>
          <button
            onClick={() => copyToClipboard(verificationSnippet, "verification")}
            className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors flex items-center gap-1 text-xs"
          >
            {copiedSection === "verification" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <pre className="p-4 text-xs font-mono text-blue-300/90 overflow-x-auto leading-relaxed">
          {verificationSnippet}
        </pre>
      </div>
    </div>
  );
};
