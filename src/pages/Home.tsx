import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { fetchHomeData } from "../services/api";
import type { HomeData, GpaResults } from "../types";

import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardFooter from "../components/dashboard/DashboardFooter";
import HeroSection from "../components/home/HeroSection";
import QuickActions from "../components/home/QuickActions";
import AcademicServices from "../components/home/AcademicServices";
import MentorCard from "../components/home/MentorCard";
import NoticeBoard from "../components/home/NoticeBoard";
import GpaSummaryCard from "../components/home/GpaSummaryCard";

export default function Home() {
  const { session, username, signOut, consumeInitialResults } = useAuth();
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cachedResults, setCachedResults] = useState<GpaResults | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      toast.error("Error signing out");
    }
  };

  const loadHomeData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const data = await fetchHomeData(session);
      setHomeData(data);

      // Use photo from FOSMIS response, or fallback to constructed URL
      if (data.photoUrl) {
        setProfileImage(data.photoUrl);
      } else if (username) {
        setProfileImage(
          `https://paravi.ruh.ac.lk/rumis/picture/user_pictures/student_std_pics/fosmis_pic/sc${username}.jpg`
        );
      }
    } catch {
      toast.error("Error loading home data");
    } finally {
      setLoading(false);
    }
  }, [session, username]);

  useEffect(() => {
    if (!session || fetchedRef.current) return;
    fetchedRef.current = true;

    // Try to grab pre-fetched results from login (for GPA summary)
    const prefetched = consumeInitialResults();
    if (prefetched) {
      setCachedResults(prefetched);
    }

    // Also check sessionStorage for cached results from Results page visits
    const stored = sessionStorage.getItem("homeGpaCache");
    if (stored && !prefetched) {
      try {
        setCachedResults(JSON.parse(stored));
      } catch {
        // ignore
      }
    }

    loadHomeData();
  }, [session, loadHomeData, consumeInitialResults]);

  // Cache results in sessionStorage when they arrive (for persisting across navigations)
  useEffect(() => {
    if (cachedResults) {
      sessionStorage.setItem("homeGpaCache", JSON.stringify(cachedResults));
    }
  }, [cachedResults]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader
        username={username}
        profileImage={profileImage}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Hero Section */}
        <HeroSection
          studentName={homeData?.studentName || ""}
          username={username}
          photoUrl={profileImage}
          gpa={cachedResults?.gpa}
          totalCredits={cachedResults?.totalCredits}
        />

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            <QuickActions />
            <AcademicServices />
            <NoticeBoard notices={homeData?.notices || []} loading={loading} />
          </div>

          {/* Right column - 1/3 */}
          <div className="space-y-6">
            <MentorCard mentor={homeData?.mentor || null} loading={loading} />
            <GpaSummaryCard results={cachedResults} />
          </div>
        </div>
      </main>

      <DashboardFooter />
    </div>
  );
}
