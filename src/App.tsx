import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Toaster } from "sonner";
import ErrorBoundary from "./components/ErrorBoundary";
import { Layout } from "./components/Layout";
import { PrivateRoute } from "./components/PrivateRoute";
import { PublicRoute } from "./components/PublicRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { ColorModeProvider } from "./contexts/ColorModeContext";
import { useAuthState } from "./hooks/useAuthState";
import { initSessionActivity } from "./utils/session";

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const CreatePost = lazy(() => import("./pages/CreatePost"));
const EditPost = lazy(() => import("./pages/EditPost"));
const Post = lazy(() => import("./pages/Post"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Search = lazy(() => import("./pages/Search"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Profile = lazy(() => import("./pages/Profile"));
const SavedPosts = lazy(() => import("./pages/SavedPosts"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageLoader = () => (
  <div className="flex justify-center items-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
  </div>
);

const SessionTimeoutHandler = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { user } = useAuthState();

  useEffect(() => {
    if (!user) return;

    const cleanup = initSessionActivity(() => {
      toast.error("Sessão expirada. Faça login novamente.");
      navigate("/login");
    });

    return cleanup;
  }, [user, navigate]);

  return <>{children}</>;
};

const AppContent = () => {
  const { user } = useAuthState();

  return (
    <SessionTimeoutHandler>
      <AuthProvider value={{ user }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route
                path="posts/create"
                element={
                  <PrivateRoute>
                    <CreatePost />
                  </PrivateRoute>
                }
              />
              <Route
                path="posts/edit/:id"
                element={
                  <PrivateRoute>
                    <EditPost />
                  </PrivateRoute>
                }
              />
              <Route path="posts/:id" element={<Post />} />
              <Route
                path="dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard createdBy={user?.email || ""} />
                  </PrivateRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="saved"
                element={
                  <PrivateRoute>
                    <SavedPosts />
                  </PrivateRoute>
                }
              />
              <Route path="search" element={<Search />} />
              <Route
                path="login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />
              <Route path="resetPassword" element={<ResetPassword />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </SessionTimeoutHandler>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ColorModeProvider>
          <Toaster position="top-right" richColors />
          <AppContent />
        </ColorModeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
