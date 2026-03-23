import { LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { apiBaseUrl } from "@/lib/api";
import { creatorDataSourceLabel, isDemoMode } from "@/lib/demo";

const LoginPage = () => {
    const handleLogin = () => {
        // Redirect to backend OAuth initiation endpoint
        window.location.href = `${apiBaseUrl}/auth/login`;
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
            <div className="mx-auto flex w-full max-w-sm flex-col justify-center space-y-6 sm:w-[350px]">
                <div className="flex flex-col space-y-2 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Welcome to Competitor Spy
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Sign in with your YouTube Channel to unlock insights, performance metrics, and competitive advantages.
                    </p>
                </div>

                <div className="grid gap-6">
                    {isDemoMode ? (
                        <Button asChild className="w-full" size="lg" variant="default">
                            <Link to="/">Enter Demo Workspace</Link>
                        </Button>
                    ) : (
                        <Button
                            onClick={handleLogin}
                            className="w-full"
                            size="lg"
                            variant="default"
                        >
                            <LogIn className="mr-2 h-4 w-4" />
                            Sign in with YouTube
                        </Button>
                    )}
                </div>

                <p className="px-8 text-center text-sm text-muted-foreground">
                    {isDemoMode
                        ? `${creatorDataSourceLabel} is enabled via VITE_DEMO_MODE=true. OAuth is skipped for the creator side, while competitor research stays live.`
                        : "By clicking continue, you agree to our Terms of Service and Privacy Policy. We only ask for read-only access to your YouTube Analytics."}
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
