import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { backendUrl } from "@/config/api";

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
                console.log("❌ Onboarding check: userId or user not loaded", { userId, user: !!user });
                return;
            }

            console.log("🔍 Checking onboarding status for userId:", userId);
            console.log("🌐 Backend URL:", backendUrl);

            try {
                const token = await getToken();
                if (!token) {
                    console.log("❌ Onboarding check: No token available");
                    return;
                }

                console.log("🔐 Token available, making API call...");
                const response = await fetch(`${backendUrl}api/users/${userId}/profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                console.log("📡 API Response status:", response.status);

                if (!response.ok) {
                    console.log("❌ API response not ok:", response.statusText);
                    throw new Error("Failed to fetch user data");
                }

                const data = await response.json();
                console.log("📊 API Response data:", data);

                // Navigation logic is now a side effect within the hook
                if (data.onboarded) {
                    console.log("✅ User is onboarded, navigating to /homefeed");
                    navigate("/homefeed", { replace: true });
                } else {
                    console.log("👤 User not onboarded, navigating to /profileSetup");
                    navigate("/profileSetup", { replace: true });
                }
            } catch (error) {
                console.error("❌ Onboarding check failed:", error);
                // Navigate to profile setup as fallback
                navigate("/profileSetup", { replace: true });
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