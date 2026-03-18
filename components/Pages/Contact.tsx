'use client';

import React, { useState, Suspense } from "react";
import Navbar from "@/components/Components/Navbar";
import Footer from "@/components/Components/Footer";
import axiosInstance from "@/lib/api/axiosInstance";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaExclamationCircle } from 'react-icons/fa';

const inputClass =
  "w-full border border-red-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-400 bg-white box-border";

const labelClass = "block text-sm font-semibold text-gray-800 mb-1";

const Contact: React.FC = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post("/api/contact", form);
      toast.success(
        <div className="flex items-center gap-2">
          <span>Your message has been sent successfully! We'll get back to you soon.</span>
        </div>,
        { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true }
      );
      setForm({ firstName: "", lastName: "", email: "", phone: "", subject: "", message: "" });
    } catch (err: unknown) {
      let errorMessage = "Oops! Something went wrong. Please try again later.";
      if (
        err && typeof err === "object" && "response" in err &&
        err.response && typeof err.response === "object" && "data" in err.response &&
        err.response.data && typeof err.response.data === "object" && "message" in err.response.data
      ) {
        // @ts-expect-error: dynamic error shape from axios
        errorMessage = err.response.data.message || errorMessage;
      }
      toast.error(
        <div className="flex items-center gap-2">
          <FaExclamationCircle size={20} />
          <span>{errorMessage}</span>
        </div>,
        { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Suspense fallback={<div className="h-20" />}>
        <Navbar />
      </Suspense>

      {/* ── Page wrapper ── */}
      <div className="w-full min-h-screen bg-[#e8eaed] flex items-center justify-center px-4 sm:px-6 lg:px-10 py-10 sm:py-14 box-border">
        <div className="w-full max-w-[1100px] flex flex-col lg:flex-row lg:items-stretch gap-8 lg:gap-12">

          {/* ══════════ LEFT COLUMN ══════════ */}
          <div className="w-full lg:w-[340px] lg:flex-shrink-0 flex flex-col">

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl font-extrabold text-orange-500 leading-tight mb-4">
              Contact Us
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-[0.95rem] text-gray-500 leading-relaxed mb-8">
              We're here to help! Have questions, feedback, or need assistance?
              Reach out via email, phone, or the form and we'll respond promptly.
            </p>

            {/* Contact info */}
            <div className="flex flex-col gap-4 mb-8">

              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h2.28a1 1 0 01.95.68l1.1 3.3a1 1 0 01-.23 1.05L7.5 9.6a16.016 16.016 0 006.9 6.9l1.57-1.62a1 1 0 011.05-.23l3.3 1.1a1 1 0 01.68.95V19a2 2 0 01-2 2C9.16 21 3 14.84 3 7V5z" />
                </svg>
                <span className="text-gray-700 text-sm sm:text-[0.95rem]">+977-9700620004</span>
              </div>

              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h2.28a1 1 0 01.95.68l1.1 3.3a1 1 0 01-.23 1.05L7.5 9.6a16.016 16.016 0 006.9 6.9l1.57-1.62a1 1 0 011.05-.23l3.3 1.1a1 1 0 01.68.95V19a2 2 0 01-2 2C9.16 21 3 14.84 3 7V5z" />
                </svg>
                <span className="text-gray-700 text-sm sm:text-[0.95rem]">01-4720234</span>
              </div>

              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-700 text-sm sm:text-[0.95rem]">Dajuvai106@gmail.com</span>
              </div>

              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0L6.343 16.657A8 8 0 1117.657 16.657z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-700 text-sm sm:text-[0.95rem]">Kathmandu, Nepal</span>
              </div>
            </div>

            {/* Vendor card */}
            <div className="bg-white rounded-2xl border-l-[5px] border-orange-500 shadow-md px-5 py-5">
              <h2 className="text-orange-500 font-bold text-[1.05rem] sm:text-[1.15rem] mb-2">
                Want to Become a Vendor?
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">
                Join our platform and reach thousands of customers across Nepal.
              </p>
              <button
                className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 transition-colors text-white font-bold text-sm sm:text-[0.9rem] px-6 py-2.5 rounded-xl"
              >
                Become a Vendor
              </button>
            </div>

          </div>

          {/* ══════════ RIGHT COLUMN — FORM CARD ══════════ */}
          <div className="flex-1 bg-white rounded-2xl shadow-[0_6px_40px_rgba(0,0,0,0.12)] px-5 sm:px-8 lg:px-10 py-7 sm:py-9 flex flex-col">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 sm:gap-5 flex-1"
            >

              {/* First Name + Last Name — stacked on mobile, side-by-side on sm+ */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                <div className="flex-1">
                  <label className={labelClass}>
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="firstName"
                    placeholder="Enter your first name"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="lastName"
                    placeholder="Enter your last name"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className={labelClass}>
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>

              {/* Phone */}
              <div>
                <label className={labelClass}>
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  name="phone"
                  placeholder="Enter phone number"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>

              {/* Subject */}
              <div>
                <label className={labelClass}>
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  name="subject"
                  placeholder="Enter the subject of your message"
                  value={form.subject}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>

              {/* Message — grows to fill remaining height on desktop */}
              <div className="flex flex-col flex-1">
                <label className={labelClass}>
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  placeholder="Enter your message here..."
                  value={form.message}
                  onChange={handleChange}
                  required
                  className={`${inputClass} resize-vertical flex-1 min-h-[140px] sm:min-h-[160px]`}
                  style={{ display: 'flex' }}
                />
              </div>

              {/* Submit */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-white font-bold text-sm sm:text-[0.95rem] px-8 py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  {loading && (
                    <svg
                      className="animate-spin w-4 h-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </div>

            </form>
          </div>

        </div>
      </div>

      <ToastContainer />
      <Footer />
    </>
  );
};

export default Contact;