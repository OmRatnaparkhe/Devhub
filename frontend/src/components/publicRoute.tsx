import { useUser } from "@clerk/clerk-react"
import { useNavigate } from "react-router-dom";

interface PublicRouteProps{
    children:React.ReactNode
}
export function PublicRoute({children}:PublicRouteProps){

    const {isLoaded,isSignedIn} = useUser();
    const navigate = useNavigate();

    if(isLoaded && isSignedIn){
        navigate("/onboard",{replace:true});
    }

    if(!isLoaded){
        return <div>Loading...</div>
    }

    return <>{children}</>
}