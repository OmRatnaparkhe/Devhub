import { Button } from "@/components/ui/button";
import { WavyBackground } from "@/components/ui/wavy-background";
import { SignedOut, SignInButton, SignOutButton, SignedIn,  SignUpButton } from "@clerk/clerk-react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <WavyBackground
        containerClassName="relative overflow-hidden"
        backgroundFill={"hsl(var(--background))"}
        waveOpacity={0.35}
        blur={14}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-text bg-clip-text text-transparent">
              Build. Show. Connect.
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Create remarkable projects, showcase your craft, and connect with developers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
              
               <SignUpButton mode="modal">
                 <Button variant="outline" size="xl" asChild>
                  <span>Get Started</span>
                </Button>
              </SignUpButton>
              <SignedOut>
               <SignInButton mode="modal">
                 <Button variant="hero" size="xl" asChild>
                  <span>Sign In</span>
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <SignOutButton>
                <Button size="sm">Sign Out</Button>
              </SignOutButton>
            </SignedIn>
            </div>
          </div>
        </div>
      </WavyBackground>
    </div>
  );
};

export default Landing;