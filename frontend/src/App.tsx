import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/layout/AppLayout";
import OverviewPage from "@/pages/OverviewPage";
import ViewsBreakdownPage from "@/pages/ViewsBreakdownPage";
import ContentDNAPage from "@/pages/ContentDNAPage";
import CadencePage from "@/pages/CadencePage";
import AudiencePage from "@/pages/AudiencePage";
import NicheDetailPage from "@/pages/NicheDetailPage";
import CompetitorDiscoveryPage from "@/pages/CompetitorDiscoveryPage";
import LandscapePage from "@/pages/LandscapePage";
import CompetitorDetailPage from "@/pages/CompetitorDetailPage";
import StrategyReportPage from "@/pages/StrategyReportPage";
import VideoIdeasPage from "@/pages/VideoIdeasPage";
import TitleOptimizerPage from "@/pages/TitleOptimizerPage";
import ThumbnailsPage from "@/pages/ThumbnailsPage";
import NotFound from "@/pages/NotFound";
import LoginPage from "@/pages/LoginPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<Navigate to="/" replace />} />

          <Route path="/app" element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<OverviewPage />} />
              <Route path="views" element={<ViewsBreakdownPage />} />
              <Route path="content-dna" element={<ContentDNAPage />} />
              <Route path="cadence" element={<CadencePage />} />
              <Route path="audience" element={<AudiencePage />} />
              <Route path="niche/:nicheId" element={<NicheDetailPage />} />
              <Route path="competitors" element={<CompetitorDiscoveryPage />} />
              <Route path="competitors/landscape" element={<LandscapePage />} />
              <Route path="competitors/:competitorId" element={<CompetitorDetailPage />} />
              <Route path="strategy" element={<StrategyReportPage />} />
              <Route path="strategy/ideas" element={<VideoIdeasPage />} />
              <Route path="strategy/titles" element={<TitleOptimizerPage />} />
              <Route path="strategy/thumbnails" element={<ThumbnailsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
