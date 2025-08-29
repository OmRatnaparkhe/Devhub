import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react';

const PublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if(!PublishableKey){
    throw new Error("Publishable key not found!!")
}

createRoot(document.getElementById("root")!).render(
<ClerkProvider publishableKey={PublishableKey}><App /></ClerkProvider>
);
