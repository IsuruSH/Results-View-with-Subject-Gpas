import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import Results from "./pages/Results";
import Home from "./pages/Home";
import CourseRegistration from "./pages/CourseRegistration";
import AcademicGuide from "./pages/AcademicGuide";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/results"
            element={
              <ProtectedRoute>
                <Results />
              </ProtectedRoute>
            }
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses"
            element={
              <ProtectedRoute>
                <CourseRegistration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic-guide"
            element={
              <ProtectedRoute>
                <AcademicGuide />
              </ProtectedRoute>
            }
          />
          {/* Redirect root to /results for backwards compat */}
          <Route path="/" element={<Navigate to="/results" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" />
    </AuthProvider>
  );
}

export default App;
