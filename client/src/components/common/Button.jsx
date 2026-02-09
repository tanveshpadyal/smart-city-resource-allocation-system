/**
 * Button Component
 * Reusable button with variants
 */

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  className = "",
  onClick,
  type = "button",
  ...props
}) => {
  const baseStyles =
    "font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2";

  const variantStyles = {
    primary:
      "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800",
    secondary:
      "bg-neutral-200 text-neutral-800 hover:bg-neutral-300 active:bg-neutral-400",
    danger: "bg-error-600 text-white hover:bg-error-700 active:bg-error-800",
    success:
      "bg-success-600 text-white hover:bg-success-700 active:bg-success-800",
    outline:
      "border-2 border-primary-600 text-primary-600 hover:bg-primary-50 active:bg-primary-100",
    ghost: "text-primary-600 hover:bg-primary-50 active:bg-primary-100",
  };

  const sizeStyles = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {loading && (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
};

export default Button;
