import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 text-center">
      <p className="text-lg font-semibold text-gray-900">Page not found</p>
      <Link to="/" className="text-sm text-gray-500 hover:text-gray-800">
        Go home
      </Link>
    </div>
  );
}
