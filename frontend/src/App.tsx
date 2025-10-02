import  { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Projects from "./components/dashboard/Project";
import Blog from "./pages/Blog";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/publicRoute";
import ProfileSetup from "./pages/onboarding/ProfileSetup";
import FollowUsers from "./pages/onboarding/FollowUsers";
import Home from "./pages/home/Home";
import OnBoarded from "./components/onBoardingCheck";
import ConnectionsPage from "./pages/home/FollowersPage";
import BookmarksPage from "./pages/BookmarksPage";
import ProjectDetailPage from "./components/dashboard/ProjectDetail";

// Lazy loaded heavy pages
const Profile = lazy(() => import("./pages/home/newProfilepage"));
const MessagesPage = lazy(() => import("./pages/home/Messages").then(m => ({ default: m.MessagesPage })));


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Navbar />
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <OnBoarded />
              </ProtectedRoute>
            } />
            <Route path="/welcome" element={
              <PublicRoute>
                <Landing />
              </PublicRoute>
            } />


            <Route path="/profileSetup" element={
              <ProtectedRoute>
                <ProfileSetup />
              </ProtectedRoute>
            } />
            <Route path="/followUsers" element={
              <ProtectedRoute>
                <FollowUsers />
              </ProtectedRoute>
            } />
            <Route path="/homefeed" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />

            <Route path="/projects" element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            } />
            <Route path="/projects/:projectId" element={
              <ProjectDetailPage/>
            }/>
            <Route path="/profile/:userId" element={
              <ProtectedRoute>
                <Suspense fallback={<div className="pt-24 flex justify-center"><span>Loading profile...</span></div>}>
                  <Profile />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/profile/:userId/followers" element={
              <ProtectedRoute><ConnectionsPage /></ProtectedRoute>
            } />
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="/messages" element={
              <Suspense fallback={<div className="pt-24 flex justify-center"><span>Loading messages...</span></div>}>
                <MessagesPage />
              </Suspense>
            } />
            <Route path="/blog" element={
              <ProtectedRoute><Blog /></ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
