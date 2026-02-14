import { useEffect, useRef, useState } from "react";
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

  // ---------------------------------------------------------------------------
  // State — ALL seeded from centralized cache for instant render on navigation
  // ---------------------------------------------------------------------------
  const [homeData, setHomeData] = useState<HomeData | null>(
    () => getCached<HomeData>(CACHE_KEYS.homeData)
  );
  const [noticesData, setNoticesData] = useState<NoticesData | null>(
    () => getCached<NoticesData>(CACHE_KEYS.notices)
  );
  const [cachedResults, setCachedResults] = useState<GpaResults | null>(() => {
    if (username) {
      const mem = getCached<GpaResults>(CACHE_KEYS.results(username, "4"));
      if (mem) return mem;
    }
    try {
      const stored = sessionStorage.getItem("homeGpaCache");
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return null;
  });
  const [profileImage, setProfileImage] = useState<string | null>(() =>
    getProfileImage(username)
  );

  // Loading flags — false if data was seeded from cache (no spinner flash)
  const [loading, setLoading] = useState(() => !getCached(CACHE_KEYS.homeData));
  const [noticesLoading, setNoticesLoading] = useState(
    () => !getCached(CACHE_KEYS.notices)
  );

  const fetchedRef = useRef(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      toast.error("Error signing out");
    }
  };

  // ---------------------------------------------------------------------------
  // Independent fetches — each section updates as its data arrives (streaming)
  // No Promise.allSettled — fast data renders immediately, slow data streams in.
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!session || fetchedRef.current) return;
    fetchedRef.current = true;

    // Grab pre-fetched results from login
    const prefetched = consumeInitialResults();
    if (prefetched) setCachedResults(prefetched);

    // Fire home data fetch independently
    fetchHomeData(session)
      .then((data) => {
        setHomeData(data);
        if (data.photoUrl) {
          setProfileImage(data.photoUrl);
          if (username) cacheProfileImage(username, data.photoUrl);
        }
      })
      .catch(() => toast.error("Error loading home data"))
      .finally(() => setLoading(false));

    // Fire notices fetch independently — renders when ready, doesn't block hero/mentor
    fetchNotices(session)
      .then((data) => setNoticesData(data))
      .catch(() => {
        /* silent — notices section just shows loading */
      })
      .finally(() => setNoticesLoading(false));
  }, [session, username, consumeInitialResults]);

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
