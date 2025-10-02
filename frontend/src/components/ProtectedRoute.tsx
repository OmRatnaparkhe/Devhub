import {SignInButton, useUser} from "@clerk/clerk-react"

interface ProtectedRouteProps {
    children:React.ReactNode
}
export function ProtectedRoute({children}:ProtectedRouteProps){
    const {isLoaded, isSignedIn,user} = useUser();
    
        if(isLoaded && !isSignedIn){
           return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <h1 className="text-2xl font-bold mb-4">You need to sign in to access this page</h1>
        <SignInButton mode="modal">
          <button className="px-6 py-2 rounded-md bg-primary text-white hover:bg-primary/90 transition">
            Sign In
          </button>
        </SignInButton>
        <p className="text-md mt-4">
          Or <a href="/welcome" className="underline text-primary">go back to Home</a>
        </p>
      </div>
    );
        }
    

    if(!isLoaded){
        return <div>Loading...</div>
    }

    if(!user){
        return null;
    }

    return isSignedIn? <>{children}</> :null
}