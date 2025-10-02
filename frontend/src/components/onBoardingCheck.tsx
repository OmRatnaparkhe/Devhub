import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

// The component function is now synchronous
export default function OnBoarded() {
    // Hooks are called at the top level
    const { getToken, userId } = useAuth();
    const { user } = useUser();
    const navigate = useNavigate();

    // Asynchronous logic is moved into a useEffect hook
    useEffect(() => {
        // We can't make the useEffect callback async directly,
        // so we define an async function inside it.
        const checkOnboardingStatus = async () => {
            // Guard clauses to ensure hooks have loaded before proceeding
            if (!userId || !user) {
                return;
            }

            try {
                const token = await getToken();
                if (!token) {
                    // Handle case where token is not available
                    return;
                }

                const response = await fetch(`http://localhost:3000/api/users/${userId}/profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch user data");
                }

                const data = await response.json();

                // Navigation logic is now a side effect within the hook
                if (data.onboarded) {
                    navigate("/homefeed", { replace: true });
                } else {
                    navigate("/profileSetup", { replace: true });
                }
            } catch (error) {
                console.error("Onboarding check failed:", error);
                // Optional: navigate to an error page
                // navigate("/error");
            }
        };

        checkOnboardingStatus();
    }, [userId, user, getToken, navigate]); // Dependency array ensures the effect runs when these values change

    // The component always returns the loader while the check is in progress.
    // The navigation will automatically move the user away once the check is complete.
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}