/**
 * Spinner Component
 * Loading indicator
 */

export const Spinner = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-4",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-primary-300 border-t-primary-600 ${sizeClasses[size]} ${className}`}
    />
  );
};

export const PageSpinner = () => (
  <div className="flex h-screen items-center justify-center bg-neutral-50">
    <div className="text-center">
      <Spinner size="lg" />
      <p className="mt-4 text-neutral-600">Loading...</p>
    </div>
  </div>
);

export const InlineSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="text-center">
      <Spinner size="md" />
      <p className="mt-2 text-sm text-neutral-600">Loading...</p>
    </div>
  </div>
);

export default Spinner;
