/**
 * Not Found Page (404)
 */

import { Link } from "react-router-dom";
import { MainLayout } from "../components/layouts/MainLayout";
import { Button } from "../components/common";

export const NotFoundPage = () => {
  return (
    <MainLayout>
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Page Not Found
          </h2>
          <p className="text-neutral-600 mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist. It might have been moved
            or deleted.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/login">
              <Button variant="primary">Go to Login</Button>
            </Link>
            <Link to="/">
              <Button variant="secondary">Go Home</Button>
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default NotFoundPage;
