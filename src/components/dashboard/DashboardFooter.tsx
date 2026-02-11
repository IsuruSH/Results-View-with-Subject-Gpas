import { AlertCircle, MessageCircle } from "lucide-react";

export default function DashboardFooter() {
  return (
    <>
      {/* Alerts */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 space-y-3">
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            Response times may be slower as our server is hosted on a free
            platform. Thank you for your patience!
          </p>
        </div>

        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <MessageCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700">
            If you want to remove your results from this system, please
            contact me through{" "}
            <a
              href="https://wa.me/94768324613"
              className="font-medium underline hover:text-blue-900"
            >
              WhatsApp
            </a>
            .
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-4">
        <p className="text-center text-xs text-gray-400">
          Developed by Isuru Shanaka, Department of Computer Science
        </p>
      </footer>
    </>
  );
}
