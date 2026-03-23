import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Trophy, AlertTriangle, CheckCircle2, Wand2 } from "lucide-react";
import { AnalysisLoader } from "@/components/shared/AnalysisLoader";

interface RankingItem {
  query: string;
  rank: number;
  video_id: string;
  title: string;
  competitors_ahead: number;
}

const VideoRankingPage = () => {
  const [loading, setLoading] = useState(true);
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string>("all");

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      // Faux loading
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/ranking`);
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setRankings(data);
      } catch (error) {
        console.error("Error fetching rankings:", error);
        // Fallback mock data if API fails
        setRankings([
            {"query": "best linux distro 2024", "rank": 3, "video_id": "vid1", "title": "Top 10 Linux Distros for Beginners", "competitors_ahead": 2},
            {"query": "nix-os guide", "rank": 1, "video_id": "vid2", "title": "NixOS: The Ultimate Guide", "competitors_ahead": 0},
            {"query": "arch linux installation", "rank": 12, "video_id": "vid3", "title": "Arch Linux Install Tutorial", "competitors_ahead": 11},
            {"query": "terminal setup zsh", "rank": 5, "video_id": "vid4", "title": "My Terminal Setup 2024", "competitors_ahead": 4},
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  if (loading && rankings.length === 0) {
    return (
      <AnalysisLoader
        className="min-h-[52vh]"
        eyebrow="Search Engine Analysis"
        title="Checking global search positions"
        subtitle="The engine is querying standard video search results to identify where your content ranks for core keywords."
        steps={[
          "Pulling active videos from channel",
          "Generating potential search queries",
          "Executing search rankings simulation",
          "Compiling visibility report",
        ]}
      />
    );
  }

  const filteredRankings = selectedVideo === "all" 
    ? rankings 
    : rankings.filter(r => r.video_id === selectedVideo);

  const uniqueVideos = Array.from(new Set(rankings.map(r => r.video_id))).map(id => ({
    id,
    title: rankings.find(r => r.video_id === id)?.title || id
  }));

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Video Ranking</h1>
          <p className="text-muted-foreground">Track your video positions for key search queries.</p>
        </div>
        <div className="w-[300px]">
          <Select value={selectedVideo} onValueChange={setSelectedVideo}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by video" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Videos</SelectItem>
              {uniqueVideos.map(v => (
                <SelectItem key={v.id} value={v.id}>{v.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rank</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold">
                {(filteredRankings.reduce((acc, curr) => acc + curr.rank, 0) / filteredRankings.length || 0).toFixed(1)}
              </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top 3 Placements</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold">
                {filteredRankings.filter(r => r.rank <= 3).length}
              </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Visibility</CardTitle>
          <CardDescription>Real-time ranking across tracked keywords.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Query</TableHead>
                  <TableHead>Video</TableHead>
                  <TableHead className="text-right">Rank</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRankings.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Search className="h-3 w-3 text-muted-foreground" />
                        {r.query}
                      </div>
                    </TableCell>
                    <TableCell>{r.title}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={r.rank === 1 ? "default" : r.rank <= 3 ? "secondary" : "outline"}>
                        #{r.rank}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.rank <= 3 ? (
                        <span className="text-xs text-green-600 flex items-center justify-end gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Dominant
                        </span>
                      ) : r.rank > 10 ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs text-amber-600 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Needs Optimization
                          </span>
                          <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" asChild>
                            <Link to={`/app/strategy/titles?video=${r.video_id}`}>
                              <Wand2 className="h-3 w-3 mr-1" /> Optimize
                            </Link>
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-blue-600">Stable</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoRankingPage;
