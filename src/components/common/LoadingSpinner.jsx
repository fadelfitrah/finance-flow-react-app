const LoadingSpinner = ({ size = "md" }) => {
  const sizes = {
    sm: "h-4 w-4 border-2",
    md: "h-7 w-7 border-4",
    lg: "h-10 w-10 border-4",
  };

  return (
    <div
      className={`${sizes[size]} animate-spin rounded-full border-slate-300 border-t-blue-600`}
    />
  );
};

export default LoadingSpinner;
