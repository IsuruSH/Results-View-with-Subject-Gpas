import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { fetchHomeData, fetchNotices } from "../services/api";
import {
  getProfileImage,
  setProfileImage as cacheProfileImage,
  getCached,
  CACHE_KEYS,
} from "../services/dataCache";
import type { HomeData, GpaResults, NoticesData } from "../types";

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
  const [noticesData, setNoticesData] = useState<NoticesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [noticesLoading, setNoticesLoading] = useState(true);
  // Seed GPA results from centralized cache immediately (no flash of empty)
  const [cachedResults, setCachedResults] = useState<GpaResults | null>(() => {
    // Try in-memory cache first (fastest)
    if (username) {
      const mem = getCached<GpaResults>(CACHE_KEYS.results(username, "4"));
      if (mem) return mem;
    }
    // Fallback to sessionStorage
    try {
      const stored = sessionStorage.getItem("homeGpaCache");
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return null;
  });
  // Profile image: resolve from cache immediately (no flash)
  const [profileImage, setProfileImage] = useState<string | null>(() =>
    getProfileImage(username)
  );
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
    setNoticesLoading(true);
    try {
      // Both use centralized cache + dedup — instant if already fetched
      const [data, notices] = await Promise.allSettled([
        fetchHomeData(session),
        fetchNotices(session),
      ]);

      if (data.status === "fulfilled") {
        setHomeData(data.value);

        // Update profile image if FOSMIS returned a better URL
        if (data.value.photoUrl) {
          setProfileImage(data.value.photoUrl);
          if (username) cacheProfileImage(username, data.value.photoUrl);
        }
      } else {
        toast.error("Error loading home data");
      }

      if (notices.status === "fulfilled") {
        setNoticesData(notices.value);
      }
    } catch {
      toast.error("Error loading home data");
    } finally {
      setLoading(false);
      setNoticesLoading(false);
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

    loadHomeData();
  }, [session, loadHomeData, consumeInitialResults]);

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
            <NoticeBoard noticesData={noticesData} loading={noticesLoading} />
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
