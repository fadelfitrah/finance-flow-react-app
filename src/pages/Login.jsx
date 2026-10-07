import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { useAuth } from "../hooks/useAuth";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),

  password: z
    .string()
    .min(1, "Password wajib diisi")
    .min(6, "Password minimal 6 karakter"),
});

const Login = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      await login(data.email, data.password);
      toast.success("Login berhasil");
      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error(error);

      let message = "Login gagal. Silahkan coba lagi.";

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "invalid-credential"
      ) {
        message = "Email atau password salah.";
      }

      if (error.code === "auth/user-not-found") {
        message = "Akun tidak ditemukan.";
      }

      if (error.code === "auth/wrong-password") {
        message = "Password salah.";
      }

      if (error.code === "auth/too-many-requests") {
        message = "Terlalu banyak percobaan login. Silahkan coba lagi nanti.";
      }

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center pc-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <LockKeyhole size={28} />
          </div>

          <h1 className="text-3xl font-bold text-white">FinanceFlow AI</h1>

          <p className="mt-2 text-sm text-slate-400">
            Finance & Inventory Management System
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Welcome back</h2>

            <p className="mt-1 text-sm text-slate-400">
              Sign in to continue to your dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 text-sm text-sm font-medium text-slate-400"
              >
                Email
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  id="email"
                  type="email"
                  placeholder="example@gmail.com"
                  {...register("email")}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-10 pr-4 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>

              {errors.email && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  {...register("password")}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-10 pr-12 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {errors.password && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Belum memiliki akun?{" "}
            <Link
              to="/register"
              className="font-medium text-blue-400 transition hover:text-blue-300"
            >
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
