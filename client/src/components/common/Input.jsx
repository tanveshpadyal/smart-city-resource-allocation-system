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
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {label}
          {required && <span className="text-error-600 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-4 py-2 border rounded-lg transition-colors ${
          error
            ? "border-error-500 bg-error-50 text-error-900 placeholder-error-400 focus:border-error-600 focus:ring-2 focus:ring-error-200"
            : "border-neutral-300 bg-white text-neutral-900 placeholder-neutral-500 focus:border-primary-600 focus:ring-2 focus:ring-primary-200"
        } disabled:bg-neutral-100 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-error-600">{error}</p>}
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
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {label}
          {required && <span className="text-error-600 ml-1">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`w-full px-4 py-2 border rounded-lg transition-colors resize-none ${
          error
            ? "border-error-500 bg-error-50 text-error-900 placeholder-error-400 focus:border-error-600 focus:ring-2 focus:ring-error-200"
            : "border-neutral-300 bg-white text-neutral-900 placeholder-neutral-500 focus:border-primary-600 focus:ring-2 focus:ring-primary-200"
        } disabled:bg-neutral-100 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-error-600">{error}</p>}
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
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {label}
          {required && <span className="text-error-600 ml-1">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-4 py-2 border rounded-lg transition-colors ${
          error
            ? "border-error-500 bg-error-50 text-error-900 focus:border-error-600 focus:ring-2 focus:ring-error-200"
            : "border-neutral-300 bg-white text-neutral-900 focus:border-primary-600 focus:ring-2 focus:ring-primary-200"
        } disabled:bg-neutral-100 disabled:cursor-not-allowed ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-error-600">{error}</p>}
    </div>
  );
};

export default Input;
