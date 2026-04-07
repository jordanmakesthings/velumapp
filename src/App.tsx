import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import HomePage from "./pages/HomePage";
import LibraryPage from "./pages/LibraryPage";
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
import CourseDetailPage from "./pages/CourseDetailPage";
import CourseExperiencePage from "./pages/CourseExperiencePage";
import HomeScreenSetupPage from "./pages/HomeScreenSetupPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import AdminPage from "./pages/AdminPage";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SubcategoryPage from "./pages/SubcategoryPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/signup" element={<AuthPage />} />
            <Route path="/auth" element={<Navigate to="/signup" replace />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* App routes with layout — all protected */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/breathe" element={<BreathePage />} />
              <Route path="/tools" element={<ToolsPage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/course/:id" element={<CourseDetailPage />} />
              <Route path="/course-v2" element={<CourseExperiencePage />} />
              <Route path="/subcategory" element={<SubcategoryPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/journal" element={<JournalPage />} />
            </Route>

            {/* Full-screen protected pages (no nav) */}
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/premium" element={<ProtectedRoute><PremiumPage /></ProtectedRoute>} />
            <Route path="/player" element={<ProtectedRoute><PlayerPage /></ProtectedRoute>} />
            <Route path="/bilateral" element={<ProtectedRoute><BilateralPage /></ProtectedRoute>} />
            <Route path="/tapping" element={<ProtectedRoute><TappingGeneratorPage /></ProtectedRoute>} />
            <Route path="/somatic-touch" element={<ProtectedRoute><SomaticTouchPage /></ProtectedRoute>} />
            <Route path="/mastery-player" element={<ProtectedRoute><MasteryPlayerPage /></ProtectedRoute>} />
            <Route path="/home-setup" element={<ProtectedRoute><HomeScreenSetupPage /></ProtectedRoute>} />
            <Route path="/paymentsuccess" element={<ProtectedRoute><PaymentSuccessPage /></ProtectedRoute>} />
            <Route path="/payment-success" element={<Navigate to="/paymentsuccess" replace />} />
            <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />

            {/* Redirect old routes */}
            <Route path="/blueprint" element={<Navigate to="/profile" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
