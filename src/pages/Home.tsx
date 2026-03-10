import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { fetchHomeData, streamNotices } from "../services/api";
import {
  getProfileImage,
  setProfileImage as cacheProfileImage,
  getCached,
  setCached,
  CACHE_KEYS,
} from "../services/dataCache";
import type { HomeData, GpaResults, Notice, NoticesData } from "../types";
import { usePageTitle } from "../hooks/usePageTitle";

import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardFooter from "../components/dashboard/DashboardFooter";
import HeroSection from "../components/home/HeroSection";
import QuickActions from "../components/home/QuickActions";
import AcademicServices from "../components/home/AcademicServices";
import MentorCard from "../components/home/MentorCard";
import NoticeBoard from "../components/home/NoticeBoard";
import GpaSummaryCard from "../components/home/GpaSummaryCard";

function seedNotices(): { recent: Notice[]; previous: Notice[]; fromCache: boolean } {
  const cached = getCached<NoticesData>(CACHE_KEYS.notices);
  if (cached) {
    return {
      recent: Array.isArray(cached.recentNotices) ? cached.recentNotices : [],
      previous: Array.isArray(cached.previousNotices) ? cached.previousNotices : [],
      fromCache: true,
    };
  }
  return { recent: [], previous: [], fromCache: false };
}

export default function Home() {
  const { session, username, signOut, consumeInitialResults } = useAuth();
  usePageTitle("Home");

  // ---------------------------------------------------------------------------
  // State — ALL seeded from centralized cache for instant render on navigation
  // ---------------------------------------------------------------------------
  const [homeData, setHomeData] = useState<HomeData | null>(
    () => getCached<HomeData>(CACHE_KEYS.homeData)
  );

  const [noticesSeed] = useState(seedNotices);
  const [recentNotices, setRecentNotices] = useState<Notice[]>(noticesSeed.recent);
  const [previousNotices, setPreviousNotices] = useState<Notice[]>(noticesSeed.previous);
  const [noticesStreaming, setNoticesStreaming] = useState(false);
  const [noticesLoading, setNoticesLoading] = useState(!noticesSeed.fromCache);

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
  const [loading, setLoading] = useState(() => !getCached(CACHE_KEYS.homeData));

  const fetchedRef = useRef(false);
  const recentRef = useRef(recentNotices);
  const previousRef = useRef(previousNotices);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      toast.error("Error signing out");
    }
  };

  // ---------------------------------------------------------------------------
  // Independent fetches — each section updates as its data arrives (streaming)
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

    // If notices were served from cache, skip streaming
    if (noticesSeed.fromCache) return;

    // Stream notices — each notice renders as it arrives
    setNoticesStreaming(true);

    streamNotices(
      session,
      (type, notice) => {
        if (!notice?.title || !notice?.date) return;

        // Hide the full loading skeleton once the first notice arrives
        setNoticesLoading(false);

        if (type === "recent") {
          const list = recentRef.current;
          if (list.some((n) => n.title === notice.title && n.date === notice.date)) return;
          const next = [...list, notice];
          recentRef.current = next;
          setRecentNotices(next);
        } else {
          const list = previousRef.current;
          if (list.some((n) => n.title === notice.title && n.date === notice.date)) return;
          const next = [...list, notice];
          previousRef.current = next;
          setPreviousNotices(next);
        }
      },
      () => {
        // Stream finished — cache the final result for instant re-navigation
        setNoticesStreaming(false);
        setNoticesLoading(false);
        setCached(CACHE_KEYS.notices, {
          recentNotices: recentRef.current,
          previousNotices: previousRef.current,
        });
      },
      (err) => {
        console.warn("Notice streaming error:", err.message);
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <NoticeBoard
              recentNotices={recentNotices}
              previousNotices={previousNotices}
              sessionId={session}
              loading={noticesLoading}
              streaming={noticesStreaming}
            />
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
