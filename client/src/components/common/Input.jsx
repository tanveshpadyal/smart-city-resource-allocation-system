/**
 * Input Component
 * Form input wrapper with label and error handling
 */

export const Input = ({
  label,
  error,
  required = false,
  placeholder,
  type = "text",
  value,
  onChange,
  disabled = false,
  className = "",
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
          {label}
          {required && <span className="ml-1 text-red-600 dark:text-rose-400">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-lg border px-4 py-2 transition-colors ${
          error
            ? "border-red-500 bg-red-50 text-red-900 placeholder-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-200 dark:border-rose-500/60 dark:bg-rose-500/10 dark:text-rose-200 dark:placeholder-rose-300 dark:focus:border-rose-400 dark:focus:ring-rose-500/30"
            : "border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
        } disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-slate-800 ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600 dark:text-rose-400">{error}</p>}
    </div>
  );
};

/**
 * Textarea Component
 */
export const Textarea = ({
  label,
  error,
  required = false,
  placeholder,
  value,
  onChange,
  disabled = false,
  rows = 4,
  className = "",
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
          {label}
          {required && <span className="ml-1 text-red-600 dark:text-rose-400">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`w-full rounded-lg border px-4 py-2 transition-colors ${
          error
            ? "border-red-500 bg-red-50 text-red-900 placeholder-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-200 dark:border-rose-500/60 dark:bg-rose-500/10 dark:text-rose-200 dark:placeholder-rose-300 dark:focus:border-rose-400 dark:focus:ring-rose-500/30"
            : "border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
        } resize-none disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-slate-800 ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600 dark:text-rose-400">{error}</p>}
    </div>
  );
};

/**
 * Select Component
 */
export const Select = ({
  label,
  error,
  required = false,
  placeholder,
  value,
  onChange,
  options = [],
  disabled = false,
  className = "",
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-slate-300">
          {label}
          {required && <span className="ml-1 text-error-600 dark:text-rose-400">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full rounded-lg border px-4 py-2 transition-colors ${
          error
            ? "border-error-500 bg-error-50 text-error-900 focus:border-error-600 focus:ring-2 focus:ring-error-200 dark:border-rose-500/60 dark:bg-rose-500/10 dark:text-rose-200 dark:focus:border-rose-400 dark:focus:ring-rose-500/30"
            : "border-neutral-300 bg-white text-neutral-900 focus:border-primary-600 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
        } disabled:cursor-not-allowed disabled:bg-neutral-100 dark:disabled:bg-slate-800 ${className}`}
        {...props}
      >
        <option value="" disabled>
          {placeholder || "Select an option"}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-error-600 dark:text-rose-400">{error}</p>}
    </div>
  );
};

export default Input;
