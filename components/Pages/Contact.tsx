'use client';

import React, { useState, Suspense } from "react";
import Navbar from "@/components/Components/Navbar";
import Footer from "@/components/Components/Footer";
import axiosInstance from "@/lib/api/axiosInstance";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaExclamationCircle } from 'react-icons/fa';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        err && typeof err === 'object' && 'response' in err &&
        err.response && typeof err.response === 'object' && 'data' in err.response &&
        err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data
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
      <Suspense fallback={<div style={{ height: '80px' }} />}>
        <Navbar />
      </Suspense>

      <div style={{
        width: '100%',
        minHeight: '100vh',
        background: '#e8eaed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2.5rem',
        boxSizing: 'border-box',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1100px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',   /* both columns same height */
          gap: '3rem',
        }}>

          {/* ══════════════ LEFT COLUMN ══════════════ */}
          <div style={{
            width: '360px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
          }}>

            {/* Heading */}
            <h1 style={{ fontSize: '3rem', fontWeight: 800, color: '#f97316', lineHeight: 1.1, marginBottom: '1.1rem', marginTop: 0 }}>
              Contact Us
            </h1>

            {/* Description */}
            <p style={{ fontSize: '0.95rem', color: '#6b7280', lineHeight: 1.7, marginBottom: '2.2rem', marginTop: 0 }}>
              We're here to help! Have questions, feedback,<br />
              or need assistance? Reach out via email, phone,<br />
              or the form and we'll respond promptly.
            </p>

            {/* Contact info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem', marginBottom: '2.5rem' }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '1.2rem', height: '1.2rem', color: '#f97316', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h2.28a1 1 0 01.95.68l1.1 3.3a1 1 0 01-.23 1.05L7.5 9.6a16.016 16.016 0 006.9 6.9l1.57-1.62a1 1 0 011.05-.23l3.3 1.1a1 1 0 01.68.95V19a2 2 0 01-2 2C9.16 21 3 14.84 3 7V5z" />
                </svg>
                <span style={{ fontSize: '0.95rem', color: '#374151' }}>+977-9700620004</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '1.2rem', height: '1.2rem', color: '#f97316', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h2.28a1 1 0 01.95.68l1.1 3.3a1 1 0 01-.23 1.05L7.5 9.6a16.016 16.016 0 006.9 6.9l1.57-1.62a1 1 0 011.05-.23l3.3 1.1a1 1 0 01.68.95V19a2 2 0 01-2 2C9.16 21 3 14.84 3 7V5z" />
                </svg>
                <span style={{ fontSize: '0.95rem', color: '#374151' }}>01-4720234</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '1.2rem', height: '1.2rem', color: '#f97316', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span style={{ fontSize: '0.95rem', color: '#374151' }}>Dajuvai106@gmail.com</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '1.2rem', height: '1.2rem', color: '#f97316', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0L6.343 16.657A8 8 0 1117.657 16.657z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span style={{ fontSize: '0.95rem', color: '#374151' }}>Kathmandu, Nepal</span>
              </div>
            </div>

            {/* Vendor card */}
            <div style={{
              background: '#ffffff',
              borderRadius: '14px',
              borderLeft: '5px solid #f97316',
              boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
              padding: '1.5rem 1.6rem 1.6rem',
            }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f97316', margin: '0 0 0.55rem 0' }}>
                Want to Become a Vendor?
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#6b7280', lineHeight: 1.65, margin: '0 0 1.25rem 0' }}>
                Join our platform and reach thousands of customers across Nepal.
              </p>
              <button
                style={{
                  background: '#f97316',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  padding: '0.65rem 1.5rem',
                  borderRadius: '9px',
                  border: 'none',
                  cursor: 'pointer',
                  letterSpacing: '0.01em',
                }}
                onMouseOver={e => (e.currentTarget.style.background = '#ea6c0a')}
                onMouseOut={e => (e.currentTarget.style.background = '#f97316')}
              >
                Become a Vendor
              </button>
            </div>

          </div>

          {/* ══════════════ RIGHT COLUMN — FORM CARD ══════════════ */}
          <div style={{
            flex: 1,
            background: '#ffffff',
            borderRadius: '18px',
            boxShadow: '0 6px 40px rgba(0,0,0,0.12)',
            padding: '2.75rem 3rem',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}
            >

              {/* First Name + Last Name */}
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>
                    First Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    name="firstName"
                    placeholder="Enter your first name"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                    style={{
                      border: '1.5px solid #f87171',
                      borderRadius: '7px',
                      padding: '0.6rem 0.9rem',
                      fontSize: '0.875rem',
                      color: '#374151',
                      outline: 'none',
                      width: '100%',
                      boxSizing: 'border-box',
                      background: '#fff',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#f97316')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#f87171')}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>
                    Last Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    name="lastName"
                    placeholder="Enter your last name"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                    style={{
                      border: '1.5px solid #f87171',
                      borderRadius: '7px',
                      padding: '0.6rem 0.9rem',
                      fontSize: '0.875rem',
                      color: '#374151',
                      outline: 'none',
                      width: '100%',
                      boxSizing: 'border-box',
                      background: '#fff',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#f97316')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#f87171')}
                  />
                </div>
              </div>

              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>
                  Email <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={form.email}
                  onChange={handleChange}
                  required
                  style={{
                    border: '1.5px solid #f87171',
                    borderRadius: '7px',
                    padding: '0.6rem 0.9rem',
                    fontSize: '0.875rem',
                    color: '#374151',
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#fff',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#f97316')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#f87171')}
                />
              </div>

              {/* Phone */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>
                  Phone <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  name="phone"
                  placeholder="Enter phone number"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  style={{
                    border: '1.5px solid #f87171',
                    borderRadius: '7px',
                    padding: '0.6rem 0.9rem',
                    fontSize: '0.875rem',
                    color: '#374151',
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#fff',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#f97316')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#f87171')}
                />
              </div>

              {/* Subject */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>
                  Subject <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  name="subject"
                  placeholder="Enter the subject of your message"
                  value={form.subject}
                  onChange={handleChange}
                  required
                  style={{
                    border: '1.5px solid #f87171',
                    borderRadius: '7px',
                    padding: '0.6rem 0.9rem',
                    fontSize: '0.875rem',
                    color: '#374151',
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#fff',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#f97316')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#f87171')}
                />
              </div>

              {/* Message — flex: 1 makes it grow to fill remaining card height */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>
                  Message <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  name="message"
                  placeholder="Enter your message here..."
                  value={form.message}
                  onChange={handleChange}
                  required
                  style={{
                    border: '1.5px solid #f87171',
                    borderRadius: '7px',
                    padding: '0.6rem 0.9rem',
                    fontSize: '0.875rem',
                    color: '#374151',
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    background: '#fff',
                    flex: 1,
                    minHeight: '160px',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#f97316')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#f87171')}
                />
              </div>

              {/* Submit */}
              <div style={{ marginTop: '0.25rem' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: loading ? '#fdba74' : '#f97316',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    padding: '0.7rem 1.8rem',
                    borderRadius: '9px',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    letterSpacing: '0.01em',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={e => { if (!loading) e.currentTarget.style.background = '#ea6c0a'; }}
                  onMouseOut={e => { if (!loading) e.currentTarget.style.background = '#f97316'; }}
                >
                  {loading && (
                    <svg className="animate-spin" style={{ width: '1rem', height: '1rem' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                  {loading ? 'Sending...' : 'Send Message'}
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