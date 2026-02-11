import { GraduationCap, LogOut } from "lucide-react";

interface DashboardHeaderProps {
  username: string | null;
  profileImage: string | null;
  onSignOut: () => void;
}

export default function DashboardHeader({
  username,
  profileImage,
  onSignOut,
}: DashboardHeaderProps) {
  return (
    <header className="bg-gradient-to-r from-indigo-700 to-indigo-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-semibold text-white leading-tight">
                Student Dashboard
              </h1>
              <p className="text-xs text-indigo-200/70">
                University of Ruhuna
              </p>
            </div>
            <h1 className="sm:hidden text-sm font-semibold text-white">
              Dashboard
            </h1>
          </div>

          {/* Right: Profile + Sign Out */}
          <div className="flex items-center gap-3">
            {username && (
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/15 text-white">
                SC{username}
              </span>
            )}

            {profileImage && (
              <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/25 flex-shrink-0">
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}

            <button
              onClick={onSignOut}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
