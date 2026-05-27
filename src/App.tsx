import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PaywallSheetProvider } from "@/components/PaywallSheet";
import { PremiumGate } from "@/components/PremiumGate";
import HomePage from "./pages/HomePage";
import LibraryPage from "./pages/LibraryPage";
import FinderPage from "./pages/FinderPage";
import BreathePage from "./pages/BreathePage";
import CoursesPage from "./pages/CoursesPage";
import ProfilePage from "./pages/ProfilePage";
import JournalPage from "./pages/JournalPage";
import OnboardingPage from "./pages/OnboardingPage";
import WelcomePage from "./pages/WelcomePage";
import PremiumPage from "./pages/PremiumPage";
import PlayerPage from "./pages/PlayerPage";
import MasteryPlayerPage from "./pages/MasteryPlayerPage";
import BilateralPage from "./pages/BilateralPage";
import ToolsPage from "./pages/ToolsPage";
import TappingGeneratorPage from "./pages/TappingGeneratorPage";
import SomaticTouchPage from "./pages/SomaticTouchPage";
import CheckinPage from "./pages/CheckinPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import CourseExperiencePage from "./pages/CourseExperiencePage";
import HomeScreenSetupPage from "./pages/HomeScreenSetupPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import AdminPage from "./pages/AdminPage";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AuthConfirmPage from "./pages/AuthConfirmPage";
import SubcategoryPage from "./pages/SubcategoryPage";
import CustomTrackPage from "./pages/CustomTrackPage";
import AudiosPage from "./pages/AudiosPage";
import FreeTrackPage from "./pages/FreeTrackPage";
import WelcomeBackPage from "./pages/WelcomeBackPage";
import QuizPage from "./pages/QuizPage";
import ProtocolQuizPage from "./pages/ProtocolQuizPage";
import RedesigningWorkshopPage from "./pages/RedesigningWorkshopPage";
import RedesigningWorkshopThanksPage from "./pages/RedesigningWorkshopThanksPage";
import RedesigningCohortWelcomePage from "./pages/RedesigningCohortWelcomePage";
import RedesigningCohortPage from "./pages/RedesigningCohortPage";
import NotFound from "./pages/NotFound";
import { captureAttribution } from "@/lib/attribution";

const queryClient = new QueryClient();

// Fire on first module load so UTMs are captured before any route renders.
captureAttribution();

// Premium page wrappers — each gets a PremiumGate fallback that opens the paywall sheet.
const Gated = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
  <PremiumGate title={title} description={description}>{children}</PremiumGate>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PaywallSheetProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/signup" element={<AuthPage />} />
            <Route path="/trial-free" element={<Navigate to="/signup" replace />} />
            <Route path="/free-track" element={<FreeTrackPage />} />
            <Route path="/welcome-back" element={<WelcomeBackPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/protocol-quiz" element={<ProtocolQuizPage />} />
            <Route path="/redesigning-workshop" element={<RedesigningWorkshopPage />} />
            <Route path="/redesigning-workshop/thanks" element={<RedesigningWorkshopThanksPage />} />
            <Route path="/redesigning-cohort" element={<RedesigningCohortPage />} />
            <Route path="/redesigning-cohort/welcome" element={<RedesigningCohortWelcomePage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/signin" element={<Navigate to="/login" replace />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/confirm" element={<AuthConfirmPage />} />

            {/* App routes with layout — auth-protected, mix of free + gated */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/finder" element={<FinderPage />} />
              <Route path="/breathe" element={<BreathePage />} />
              <Route path="/tools" element={<Gated title="Interactive Tools" description="Tapping, bilateral, somatic touch — the full real-time toolkit. Premium unlocks everything beyond breathwork."><ToolsPage /></Gated>} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/course/:id" element={<CourseDetailPage />} />
              <Route path="/course-v2" element={<CourseExperiencePage />} />
              <Route path="/subcategory" element={<SubcategoryPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/journal" element={<JournalPage />} />
              <Route path="/custom-track" element={<Gated title="Your Custom Rewiring Audio" description="A 60-second conversation. A personalized 10-minute Ericksonian audio in your chosen voice. The Velum moat — unlocked with Premium."><CustomTrackPage /></Gated>} />
              <Route path="/audios" element={<AudiosPage />} />
            </Route>

            {/* Full-screen protected pages (no nav) */}
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/premium" element={<ProtectedRoute><PremiumPage /></ProtectedRoute>} />
            <Route path="/player" element={<ProtectedRoute><PlayerPage /></ProtectedRoute>} />
            <Route path="/bilateral" element={<ProtectedRoute><Gated title="Bilateral Stimulation" description="Visual + stereo audio bilateral tool. Unlock with Premium."><BilateralPage /></Gated></ProtectedRoute>} />
            <Route path="/tapping" element={<ProtectedRoute><Gated title="EFT Tapping" description="Guided tapping sequences for clearing stress and limiting beliefs. Premium-only."><TappingGeneratorPage /></Gated></ProtectedRoute>} />
            <Route path="/somatic-touch" element={<ProtectedRoute><Gated title="Somatic Touch" description="Grounding sequences for nervous-system regulation. Premium-only."><SomaticTouchPage /></Gated></ProtectedRoute>} />
            <Route path="/checkin" element={<ProtectedRoute><Gated title="Daily Check-in" description="Rate your nervous system and get a tool recommendation. Premium-only."><CheckinPage /></Gated></ProtectedRoute>} />
            <Route path="/mastery-player" element={<ProtectedRoute><MasteryPlayerPage /></ProtectedRoute>} />
            <Route path="/home-setup" element={<ProtectedRoute><HomeScreenSetupPage /></ProtectedRoute>} />
            <Route path="/paymentsuccess" element={<ProtectedRoute><PaymentSuccessPage /></ProtectedRoute>} />
            <Route path="/payment-success" element={<Navigate to="/paymentsuccess" replace />} />
            <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />

            {/* Redirect old routes */}
            <Route path="/blueprint" element={<Navigate to="/profile" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          </PaywallSheetProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
