import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import HomePage from "./pages/HomePage";
import LibraryPage from "./pages/LibraryPage";
import BreathePage from "./pages/BreathePage";
import CoursesPage from "./pages/CoursesPage";
import ProfilePage from "./pages/ProfilePage";
import JournalPage from "./pages/JournalPage";
import BlueprintPage from "./pages/BlueprintPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/breathe" element={<BreathePage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/blueprint" element={<BlueprintPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
