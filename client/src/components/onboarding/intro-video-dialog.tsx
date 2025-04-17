import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/hooks/use-onboarding";

export function IntroVideoDialog() {
  const {
    introVideoWatched,
    startWalkthrough,
    skipWalkthrough,
    showIntroVideo,
  } = useOnboarding();

  const [open, setOpen] = React.useState(false);
  const [videoEnded, setVideoEnded] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Control dialog open state
  React.useEffect(() => {
    // Only show the intro video when explicitly triggered via the Get Started menu
    // or when manual showIntroVideo is called, not automatically on first login
    if (introVideoWatched && !open) {
      // Video was triggered by clicking "Watch Intro Video" in the Get Started menu
      setTimeout(() => {
        setOpen(true);
      }, 500);
      // Mark as watched so it only shows once
      localStorage.setItem("intro_video_watched", "true");
    }
  }, [introVideoWatched, open]);

  const handleCloseDialog = () => {
    setOpen(false);
    setVideoEnded(false);
  };

  const handleContinue = () => {
    handleCloseDialog();
    startWalkthrough();
  };

  const handleSkip = () => {
    handleCloseDialog();
    skipWalkthrough();
  };

  const handleVideoEnded = () => {
    setVideoEnded(true);
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to Your OKR Management System</DialogTitle>
          <DialogDescription>
            Watch this quick introduction to learn how to use the platform effectively.
          </DialogDescription>
        </DialogHeader>

        <div className="my-6">
          {/* Real video component */}
          <video
            ref={videoRef}
            className="w-full rounded-md"
            onEnded={handleVideoEnded}
            controls
            autoPlay
          >
            <source src="/attached_assets/get%20started.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={handleSkip}>
            Skip for Now
          </Button>
          <Button 
            onClick={handleContinue} 
            disabled={!videoEnded}
            className={videoEnded ? "animate-pulse" : ""}
          >
            {videoEnded ? "Continue to Explore" : "Please Watch the Video"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}