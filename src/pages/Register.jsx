import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Eye, EyeOff, LockKeyhole, Mail, UserPlus } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { useAuth } from "../hooks/useAuth";

const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email wajib diisi")
      .email("Format email tidak valid"),
    password: z
      .string()
      .min(6, "Password minimal 6 karakter")
      .regex(/[A-Z]/, "Password harus memiliki huruf kapital"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Konfirmasi password tidak sama",
    path: ["confirmPassword"],
  });

const Register = () => {
  const navigate = useNavigate();
  const { user, register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      await register(data.email, data.password);
      toast.success("Akun berhasil dibuat");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error(error);

      const message =
        error.code === "email-already-in-use"
          ? "Email sudah terdaftar. Silakan gunakan email lain."
          : error.message || "Registrasi gagal. Silakan coba lagi.";

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordFields = [
    {
      id: "password",
      label: "Password",
      placeholder: "Minimal 6 karakter",
      visible: showPassword,
      toggle: () => setShowPassword((previous) => !previous),
      registration: registerField("password"),
      error: errors.password,
    },
    {
      id: "confirmPassword",
      label: "Konfirmasi password",
      placeholder: "Ulangi password Anda",
      visible: showConfirmPassword,
      toggle: () => setShowConfirmPassword((previous) => !previous),
      registration: registerField("confirmPassword"),
      error: errors.confirmPassword,
    },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <UserPlus size={28} />
          </div>

          <h1 className="text-3xl font-bold text-white">FinanceFlow AI</h1>
          <p className="mt-2 text-sm text-slate-400">
            Finance & Inventory Management System
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Buat akun baru</h2>
            <p className="mt-1 text-sm text-slate-400">
              Mulai kelola keuangan bisnis Anda dengan lebih mudah.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-300"
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
                  {...registerField("email")}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-10 pr-4 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>

              {errors.email && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            {passwordFields.map((field) => (
              <div key={field.id}>
                <label
                  htmlFor={field.id}
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  {field.label}
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    id={field.id}
                    type={field.visible ? "text" : "password"}
                    placeholder={field.placeholder}
                    {...field.registration}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-10 pr-12 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={field.toggle}
                    aria-label={
                      field.visible
                        ? "Sembunyikan password"
                        : "Tampilkan password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500 transition hover:text-slate-300"
                  >
                    {field.visible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {field.error && (
                  <p className="mt-1 text-sm text-red-400">
                    {field.error.message}
                  </p>
                )}
              </div>
            ))}

            <div className="flex items-start gap-2 text-xs text-slate-500">
              <Check size={15} className="mt-0.5 shrink-0 text-emerald-500" />
              <span>Password akan disimpan secara aman.</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Membuat akun..." : "Buat akun"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Sudah memiliki akun?{" "}
            <Link
              to="/login"
              className="font-medium text-blue-400 transition hover:text-blue-300"
            >
              Masuk sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
