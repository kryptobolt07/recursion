import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
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
import VideoRankingPage from "@/pages/VideoRankingPage";
import NotFound from "@/pages/NotFound";
import LoginPage from "@/pages/LoginPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const LegacyAppRedirect = () => {
  const location = useLocation();

  return <Navigate to={`/app${location.pathname}${location.search}${location.hash}`} replace />;
};

const LegacyParamRedirect = ({ buildPath }: { buildPath: (params: Readonly<Record<string, string | undefined>>) => string }) => {
  const params = useParams();

  return <Navigate to={buildPath(params)} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/views" element={<LegacyAppRedirect />} />
          <Route path="/content-dna" element={<LegacyAppRedirect />} />
          <Route path="/cadence" element={<LegacyAppRedirect />} />
          <Route path="/audience" element={<LegacyAppRedirect />} />
          <Route path="/competitors" element={<LegacyAppRedirect />} />
          <Route path="/competitors/landscape" element={<LegacyAppRedirect />} />
          <Route path="/strategy" element={<LegacyAppRedirect />} />
          <Route path="/strategy/ideas" element={<LegacyAppRedirect />} />
          <Route path="/strategy/titles" element={<LegacyAppRedirect />} />
          <Route path="/strategy/thumbnails" element={<LegacyAppRedirect />} />
          <Route path="/niche/:nicheId" element={<LegacyParamRedirect buildPath={(params) => `/app/niche/${params.nicheId ?? ""}`} />} />
          <Route path="/competitors/:competitorId" element={<LegacyParamRedirect buildPath={(params) => `/app/competitors/${params.competitorId ?? ""}`} />} />

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
              <Route path="ranking" element={<VideoRankingPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
