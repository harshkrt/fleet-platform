import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import NotFoundPage from "./pages/NotFoundPage";
import BookRidePage from "./pages/customer/BookRidePage";
import MyRidesPage from "./pages/customer/MyRidesPage";
import RideDetailPage from "./pages/customer/RideDetailPage";
import AvailableRidesPage from "./pages/driver/AvailableRidesPage";
import AssignedRidesPage from "./pages/driver/AssignedRidesPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";

const HOME_BY_ROLE = {
  CUSTOMER: "/customer/book",
  DRIVER: "/driver/available",
  ADMIN: "/admin",
};

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={HOME_BY_ROLE[user.role] || "/login"} replace />;
}

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {children}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            <Route element={<ProtectedRoute roles={["CUSTOMER"]} />}>
              <Route path="/customer/book" element={<BookRidePage />} />
              <Route path="/customer/rides" element={<MyRidesPage />} />
              <Route path="/customer/rides/:id" element={<RideDetailPage />} />
            </Route>

            <Route element={<ProtectedRoute roles={["DRIVER"]} />}>
              <Route path="/driver/available" element={<AvailableRidesPage />} />
              <Route path="/driver/assigned" element={<AssignedRidesPage />} />
            </Route>

            <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}
