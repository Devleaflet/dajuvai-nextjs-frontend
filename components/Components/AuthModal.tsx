'use client';

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/context/AuthContext";
import { API_BASE_URL } from "@/lib/config";
import {
	loginSchema,
	registerSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
	type LoginFormData,
	type RegisterFormData,
	type ForgotPasswordFormData,
	type ResetPasswordFormData
} from "@/lib/validations/auth.schema";
import { FaInfoCircle } from "react-icons/fa";
import "@/styles/AuthModal.css";
import { Toaster, toast } from "react-hot-toast";

interface AuthModalProps {
	isOpen: boolean;
	onClose: (e?: React.MouseEvent) => void;
}

interface SignupResponse {
	message: string;
	userId: number;
	username: string;
}

interface LoginResponse {
	success: boolean;
	token: string;
	data: {
		userId: number;
		email: string;
		role: string;
	};
}

interface VerificationResponse {
	message: string;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
	const { login, fetchUserData } = useAuth();
	const router = useRouter();
	const [termsAgreed, setTermsAgreed] = useState<boolean>(false);
	const [isLoginMode, setIsLoginMode] = useState<boolean>(true);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<string>("");
	const [success, setSuccess] = useState<string>("");
	const [verificationToken, setVerificationToken] = useState<string>("");
	const [showVerification, setShowVerification] = useState<boolean>(false);
	const [pendingVerificationEmail, setPendingVerificationEmail] =
		useState<string>("");
	const [countdown, setCountdown] = useState<number>(0);
	const [forgotMode, setForgotMode] = useState<"none" | "request" | "reset">(
		"none"
	);
	const [showForgotPopup, setShowForgotPopup] = useState(false);
	const [showPassword, setShowPassword] = useState<boolean>(false);
	const [showConfirmPassword, setShowConfirmPassword] =
		useState<boolean>(false);

	const modalRef = useRef<HTMLDivElement | null>(null);
	const popupRef = useRef<HTMLDivElement | null>(null);

	// React Hook Form for login
	const loginForm = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		mode: 'onBlur',
		defaultValues: {
			email: '',
			password: '',
		},
	});

	// React Hook Form for register
	const registerForm = useForm<RegisterFormData>({
		resolver: zodResolver(registerSchema),
		mode: 'onBlur',
		defaultValues: {
			email: '',
			password: '',
			confirmPassword: '',
			name: '',
			phone: '',
		},
	});

	// React Hook Form for forgot password
	const forgotPasswordForm = useForm<ForgotPasswordFormData>({
		resolver: zodResolver(forgotPasswordSchema),
		mode: 'onBlur',
		defaultValues: {
			email: '',
		},
	});

	// React Hook Form for reset password
	const resetPasswordForm = useForm<ResetPasswordFormData>({
		resolver: zodResolver(resetPasswordSchema),
		mode: 'onBlur',
		defaultValues: {
			password: '',
			confirmPassword: '',
		},
	});

	useEffect(() => {
		if (isOpen) {
			document.body.classList.add("auth-modal--open");
		} else {
			document.body.classList.remove("auth-modal--open");
		}
	}, [isOpen]);

	useEffect(() => {
		let timer: NodeJS.Timeout;

		if (showVerification && countdown > 0) {
			timer = setTimeout(() => setCountdown(countdown - 1), 1000);
		}

		return () => {
			if (timer) clearTimeout(timer);
		};
	}, [countdown, showVerification]);

	// Reset forms when switching between login and register
	useEffect(() => {
		setError("");
		setSuccess("");
		loginForm.reset();
		registerForm.reset();
	}, [isLoginMode, loginForm, registerForm]);

	// Reset everything when modal closes
	useEffect(() => {
		if (!isOpen) {
			loginForm.reset();
			registerForm.reset();
			forgotPasswordForm.reset();
			resetPasswordForm.reset();
			setError("");
			setSuccess("");
			setShowVerification(false);
			setVerificationToken("");
			setPendingVerificationEmail("");
			setCountdown(0);
			setForgotMode("none");
			setShowPassword(false);
			setShowConfirmPassword(false);
			setShowForgotPopup(false);
			setTermsAgreed(false);
		}
	}, [isOpen, loginForm, registerForm, forgotPasswordForm, resetPasswordForm]);

	const handleTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setTermsAgreed(e.target.checked);
	};

	const handleSignup = async (userData: RegisterFormData) => {
		try {
			setIsLoading(true);
			setError("");
			const response = await axios.post<SignupResponse>(
				`${API_BASE_URL}/api/auth/signup`,
				{
					username: userData.name, // Backend expects 'username' field
					email: userData.email,
					password: userData.password,
					confirmPassword: userData.confirmPassword,
				},
				{
					headers: {
						"Content-Type": "application/json",
					},
				}
			);

			setSuccess(response.data.message);

			setPendingVerificationEmail(userData.email);
			setShowVerification(true);
			setCountdown(120);
			registerForm.reset();
		} catch (err) {
			if (axios.isAxiosError(err)) {
				console.error("Signup error details:", {
					status: err.response?.status,
					statusText: err.response?.statusText,
					data: err.response?.data,
					headers: err.response?.headers,
				});

				if (err.response?.status === 400 && err.response?.data?.errors) {
					const serverErrors = err.response.data.errors;

					// Map server errors to form fields
					Object.keys(serverErrors).forEach((key) => {
						if (serverErrors[key] && serverErrors[key][0]) {
							registerForm.setError(key as keyof RegisterFormData, {
								type: 'server',
								message: serverErrors[key][0],
							});
						}
					});

					setError("Please correct the validation errors");
				} else if (
					err.response?.status === 400 &&
					err.response?.data?.message
				) {
					setError(err.response.data.message);
				} else if (err.response?.status === 409) {
					setError(
						err.response.data.message || "Email or username already in use"
					);
				} else if (err.response?.data?.message) {
					setError(err.response.data.message);
				} else {
					setError(
						`Signup failed (${err.response?.status || "unknown error"
						}). Please try again.`
					);
				}
				console.error("Signup error:", err.response?.data);
			} else {
				setError("An unexpected error occurred");
				console.error("Unexpected error:", err);
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleVerifyEmail = async () => {
		try {
			setIsLoading(true);
			setError("");

			const response = await axios.post<VerificationResponse>(
				`${API_BASE_URL}/api/auth/verify`,
				{
					email: pendingVerificationEmail,
					token: verificationToken,
				},
				{
					headers: {
						"Content-Type": "application/json",
					},
				}
			);

			setSuccess(response.data.message);
			//("Email verification successful:", response.data);

			setTimeout(() => {
				setShowVerification(false);
				setVerificationToken("");
				setPendingVerificationEmail("");
				setIsLoginMode(true);
				setSuccess("");
				setCountdown(0);
			}, 3000);
		} catch (err) {
			if (axios.isAxiosError(err)) {
				const errorMessage =
					err.response?.data?.message ||
					err.response?.data?.error ||
					"Verification failed";
				setError(errorMessage);
				console.error("Verification error:", err.response?.data);
			} else {
				setError("An unexpected error occurred");
				console.error("Unexpected error:", err);
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleResendVerification = async () => {
		try {
			setIsLoading(true);
			setError("");

			const response = await axios.post<VerificationResponse>(
				`${API_BASE_URL}/api/auth/verify/resend`,
				{
					email: pendingVerificationEmail,
				},
				{
					headers: {
						"Content-Type": "application/json",
					},
				}
			);

			setSuccess(response.data.message);
			//("Verification email resent:", response.data);
			setCountdown(120);
		} catch (err) {
			if (axios.isAxiosError(err)) {
				const errorMessage =
					err.response?.data?.message ||
					err.response?.data?.error ||
					"Failed to resend verification";
				setError(errorMessage);
				console.error("Resend verification error:", err.response?.data);
			} else {
				setError("An unexpected error occurred");
				console.error("Unexpected error:", err);
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleLogin = async (userData: LoginFormData) => {
		try {
			setIsLoading(true);
			setError("");
			setSuccess("");

			const response = await axios.post<LoginResponse>(
				`${API_BASE_URL}/api/auth/login`,
				userData,
				{
					headers: {
						"Content-Type": "application/json",
					},
				}
			);

			if (response.data.success && response.data.token) {
				const userData = {
					id: response.data.data.userId,
					email: response.data.data.email,
					role: response.data.data.role,
					username: response.data.data.email?.split("@")[0] || 'user',
					isVerified: true,
				};

				login(response.data.token, userData);

				if (response.data.data.userId) {
					try {
						await fetchUserData(response.data.data.userId);
					} catch {
						// Non-fatal if this fails; continue navigation
					}
				}

				const role = response.data.data.role;
				if (role === "admin" || role === "staff") {
					router.push("/admin-dashboard");
				} else {
					router.push("/");
				}

				onClose();
			}
		} catch (err) {
			if (axios.isAxiosError(err)) {
				if (
					err.response?.status === 401 &&
					err.response?.data?.message === "Email not verified"
				) {
					setPendingVerificationEmail(userData.email);
					setShowVerification(true);
					setCountdown(120);
					setError(
						"Please verify your email first. We've sent you a verification code."
					);
				} else {
					const errorMessage =
						err.response?.data?.message ||
						err.response?.data?.error ||
						"Login failed";
					setError(errorMessage);
				}
				console.error("Login error:", err.response?.data);
			} else {
				setError("An unexpected error occurred");
				console.error("Unexpected error:", err);
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoogleLogin = () => {
		const callbackUrl = `${window.location.origin}/auth/google/callback`;
		const redirectUrl = `${API_BASE_URL}/api/auth/google?redirect_uri=${encodeURIComponent(
			callbackUrl
		)}`;

		//("Redirecting to backend Google OAuth:", redirectUrl);
		window.location.href = redirectUrl;
	};

	const handleSubmit = async (
		e: React.FormEvent<HTMLFormElement>
	): Promise<void> => {
		e.preventDefault();
		setError("");
		setSuccess("");

		if (showVerification) {
			await handleVerifyEmail();
			return;
		}

		if (isLoginMode) {
			const isValid = await loginForm.trigger();
			if (!isValid) {
				toast.error("Please fix the errors in the form", {
					position: "top-right",
				});
				return;
			}
			await handleLogin(loginForm.getValues());
		} else {
			const isValid = await registerForm.trigger();
			if (!isValid) {
				toast.error("Please fix the errors in the form", {
					position: "top-right",
				});
				return;
			}
			await handleSignup(registerForm.getValues());
		}
	};

	const handleForgotPasswordRequest = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setSuccess("");

		const isValid = await forgotPasswordForm.trigger();
		if (!isValid) {
			toast.error("Please fix the errors in the form", {
				position: "top-right",
			});
			return;
		}

		setIsLoading(true);
		try {
			const { email } = forgotPasswordForm.getValues();
			await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
			setSuccess("Password reset email sent! Check your inbox.");
			setForgotMode("reset");
		} catch {
			setError("Failed to send reset email. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleResetPassword = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setSuccess("");

		const isValid = await resetPasswordForm.trigger();
		if (!isValid) {
			toast.error("Please fix the errors in the form", {
				position: "top-right",
			});
			return;
		}

		setIsLoading(true);
		try {
			const { password, confirmPassword } = resetPasswordForm.getValues();
			const resetToken = resetPasswordForm.watch('password'); // We'll need to add a token field
			await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
				newPass: password,
				confirmPass: confirmPassword,
				token: resetToken,
			});
			setSuccess("Password reset successful! You can now log in.");
			setForgotMode("none");
			resetPasswordForm.reset();
		} catch {
			setError(
				"Failed to reset password. Please check your token and try again."
			);
		} finally {
			setIsLoading(false);
		}
	};

	const togglePasswordVisibility = () => {
		setShowPassword(!showPassword);
	};

	const toggleConfirmPasswordVisibility = () => {
		setShowConfirmPassword(!showConfirmPassword);
	};

	if (!isOpen) return null;

	return createPortal(
		<div className={`auth-modal${isOpen ? " auth-modal--open" : ""}`}>
			<Toaster position="top-center" />
			<div className="auth-modal__overlay"></div>
			<div
				className="auth-modal__content"
				ref={modalRef}
			>
				<button
					className="auth-modal__close"
					onClick={(e) => onClose(e)}
				>
					<img
						src="/assets/close.png"
						alt="Close"
					/>
				</button>

				<div className="auth-modal__header">
					<img
						src="/assets/auth.jpg"
						alt="Scrolling background"
						className="auth-modal__background"
					/>
				</div>

				<div className="auth-modal__title">
					{showVerification ? "Verify Your Email" : "Let's get Started!"}
				</div>

				{!showVerification && (
					<div className="auth-modal__tabs">
						<button
							className={`auth-modal__tab ${isLoginMode ? "auth-modal__tab--active" : ""
								}`}
							onClick={() => setIsLoginMode(true)}
						>
							LOG IN
						</button>
						<button
							className={`auth-modal__tab ${!isLoginMode ? "auth-modal__tab--active" : ""
								}`}
							onClick={() => setIsLoginMode(false)}
						>
							SIGN UP
						</button>
					</div>
				)}

				{error && (
					<div className="auth-modal__message auth-modal__message--error">
						{error}
					</div>
				)}
				{success && (
					<div className="auth-modal__message auth-modal__message--success">
						{success}
					</div>
				)}

				{!showVerification && (
					<div className="auth-modal__social-login">
						<button
							type="button"
							className="auth-modal__google-button"
							onClick={handleGoogleLogin}
							disabled={isLoading}
						>
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								className="auth-modal__google-icon"
							>
								<path
									fill="#4285F4"
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								/>
								<path
									fill="#34A853"
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								/>
								<path
									fill="#FBBC05"
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								/>
								<path
									fill="#EA4335"
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								/>
							</svg>
							Continue with Google
						</button>

						<div className="auth-modal__divider">
							<span>OR</span>
						</div>
					</div>
				)}

				<form
					className="auth-modal__form"
					onSubmit={handleSubmit}
				>
					{showVerification ? (
						<>
							<div className="auth-modal__verification-info">
								<p>We've sent a verification code to</p>
								<strong>{pendingVerificationEmail}</strong>
								<p>Please enter the 6-digit code below:</p>
							</div>

							<div className="auth-modal__form-group">
								<input
									type="text"
									className="auth-modal__input auth-modal__input--verification"
									placeholder="______"
									value={verificationToken}
									onChange={(e) => {
										const value = e.target.value.replace(/\D/g, "").slice(0, 6);
										setVerificationToken(value);
									}}
									required
									disabled={isLoading}
									maxLength={6}
									inputMode="numeric"
									pattern="\d*"
								/>
							</div>

							<button
								type="submit"
								className="auth-modal__submit"
								disabled={isLoading || verificationToken.length !== 6}
							>
								{isLoading ? "Verifying..." : "VERIFY EMAIL"}
							</button>

							<div className="auth-modal__verification-actions">
								<button
									type="button"
									className="auth-modal__link-button"
									onClick={handleResendVerification}
									disabled={isLoading || countdown > 0}
								>
									Resend Verification Code
									{countdown > 0 && (
										<div className="auth-modal__countdown">
											{Math.floor(countdown / 60)}:
											{String(countdown % 60).padStart(2, "0")}
										</div>
									)}
								</button>
							</div>
						</>
					) : (
						<>
							{!isLoginMode && (
								<div className="auth-modal__form-group">
									<input
										type="text"
										className="auth-modal__input"
										placeholder="Please enter username"
										{...registerForm.register("name")}
										disabled={isLoading}
									/>
									{registerForm.formState.errors.name && (
										<div className="error-message">
											<FaInfoCircle className="error-icon" />
											{registerForm.formState.errors.name.message}
										</div>
									)}
								</div>
							)}

							{isLoginMode ? (
								<>
									<div className="auth-modal__form-group">
										<input
											type="email"
											className="auth-modal__input"
											placeholder="Please enter email"
											{...loginForm.register("email")}
											disabled={isLoading}
										/>
										{loginForm.formState.errors.email && (
											<div className="error-message">
												<FaInfoCircle className="error-icon" />
												{loginForm.formState.errors.email.message}
											</div>
										)}
									</div>

									<div
										className="auth-modal__form-group"
										style={{ position: "relative" }}
									>
										<input
											type={showPassword ? "text" : "password"}
											className="auth-modal__input"
											placeholder="Please enter password"
											{...loginForm.register("password")}
											disabled={isLoading}
											style={{ paddingRight: "40px" }}
										/>
										<span
											style={{
												position: "absolute",
												right: "10px",
												top: "25px",
												transform: "translateY(-50%)",
												display: "flex",
												alignItems: "center",
												height: "100%",
											}}
										>
											<button
												type="button"
												onClick={togglePasswordVisibility}
												style={{
													background: "none",
													border: "none",
													cursor: "pointer",
													padding: "0",
													fontSize: "16px",
													lineHeight: 1,
												}}
												tabIndex={-1}
												aria-label={
													showPassword ? "Hide password" : "Show password"
												}
											>
												{showPassword ? (
													<svg
														width="20"
														height="20"
														viewBox="0 0 24 24"
														fill="none"
														stroke="#888"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
													>
														<ellipse
															cx="12"
															cy="12"
															rx="10"
															ry="7"
														/>
														<circle
															cx="12"
															cy="12"
															r="3.5"
														/>
													</svg>
												) : (
													<svg
														width="20"
														height="20"
														viewBox="0 0 24 24"
														fill="none"
														stroke="#888"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
													>
														<path d="M1 1l22 22" />
														<path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.11 1 12c.74-1.32 1.81-2.87 3.11-4.19M9.53 9.53A3.5 3.5 0 0 1 12 8.5c1.93 0 3.5 1.57 3.5 3.5 0 .47-.09.92-.26 1.33" />
														<path d="M14.47 14.47A3.5 3.5 0 0 1 12 15.5c-1.93 0-3.5-1.57-3.5-3.5 0-.47.09.92-.26 1.33" />
													</svg>
												)}
											</button>
										</span>
										{loginForm.formState.errors.password && (
											<div className="error-message">
												<FaInfoCircle className="error-icon" />
												{loginForm.formState.errors.password.message}
											</div>
										)}
									</div>
								</>
							) : (
								<>
									<div className="auth-modal__form-group">
										<input
											type="email"
											className="auth-modal__input"
											placeholder="Please enter email"
											{...registerForm.register("email")}
											disabled={isLoading}
										/>
										{registerForm.formState.errors.email && (
											<div className="error-message">
												<FaInfoCircle className="error-icon" />
												{registerForm.formState.errors.email.message}
											</div>
										)}
									</div>

									<div
										className="auth-modal__form-group"
										style={{ position: "relative" }}
									>
										<input
											type={showPassword ? "text" : "password"}
											className="auth-modal__input"
											placeholder="Please enter password"
											{...registerForm.register("password")}
											disabled={isLoading}
											style={{ paddingRight: "40px" }}
										/>
										<span
											style={{
												position: "absolute",
												right: "10px",
												top: "25px",
												transform: "translateY(-50%)",
												display: "flex",
												alignItems: "center",
												height: "100%",
											}}
										>
											<button
												type="button"
												onClick={togglePasswordVisibility}
												style={{
													background: "none",
													border: "none",
													cursor: "pointer",
													padding: "0",
													fontSize: "16px",
													lineHeight: 1,
												}}
												tabIndex={-1}
												aria-label={
													showPassword ? "Hide password" : "Show password"
												}
											>
												{showPassword ? (
													<svg
														width="20"
														height="20"
														viewBox="0 0 24 24"
														fill="none"
														stroke="#888"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
													>
														<ellipse
															cx="12"
															cy="12"
															rx="10"
															ry="7"
														/>
														<circle
															cx="12"
															cy="12"
															r="3.5"
														/>
													</svg>
												) : (
													<svg
														width="20"
														height="20"
														viewBox="0 0 24 24"
														fill="none"
														stroke="#888"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
													>
														<path d="M1 1l22 22" />
														<path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.11 1 12c.74-1.32 1.81-2.87 3.11-4.19M9.53 9.53A3.5 3.5 0 0 1 12 8.5c1.93 0 3.5 1.57 3.5 3.5 0 .47-.09.92-.26 1.33" />
														<path d="M14.47 14.47A3.5 3.5 0 0 1 12 15.5c-1.93 0-3.5-1.57-3.5-3.5 0-.47.09-.92.26-1.33" />
													</svg>
												)}
											</button>
										</span>
										{registerForm.formState.errors.password && (
											<div className="error-message">
												<FaInfoCircle className="error-icon" />
												{registerForm.formState.errors.password.message}
											</div>
										)}
									</div>
								</>
							)}

							{isLoginMode && !showVerification && (
								<button
									type="button"
									className="auth-modal__forgot-link"
									onClick={() => {
										setShowForgotPopup(true);
										setForgotMode("request");
									}}
								>
									Forgot Password?
								</button>
							)}

							{!isLoginMode && (
								<div>
									<div
										className="auth-modal__form-group"
										style={{ position: "relative" }}
									>
										<input
											type={showConfirmPassword ? "text" : "password"}
											className="auth-modal__input"
											placeholder="Confirm password"
											{...registerForm.register("confirmPassword")}
											disabled={isLoading}
											style={{ paddingRight: "40px" }}
										/>
										<span
											style={{
												position: "absolute",
												right: "10px",
												top: "25px",
												transform: "translateY(-50%)",
												display: "flex",
												alignItems: "center",
												height: "100%",
											}}
										>
											<button
												type="button"
												onClick={toggleConfirmPasswordVisibility}
												style={{
													background: "none",
													border: "none",
													cursor: "pointer",
													padding: "0",
													fontSize: "16px",
													lineHeight: 1,
												}}
												tabIndex={-1}
												aria-label={
													showConfirmPassword
														? "Hide password"
														: "Show password"
												}
											>
												{showConfirmPassword ? (
													<svg
														width="20"
														height="20"
														viewBox="0 0 24 24"
														fill="none"
														stroke="#888"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
													>
														<ellipse
															cx="12"
															cy="12"
															rx="10"
															ry="7"
														/>
														<circle
															cx="12"
															cy="12"
															r="3.5"
														/>
													</svg>
												) : (
													<svg
														width="20"
														height="20"
														viewBox="0 0 24 24"
														fill="none"
														stroke="#888"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
													>
														<path d="M1 1l22 22" />
														<path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.11 1 12c.74-1.32 1.81-2.87 3.11-4.19M9.53 9.53A3.5 3.5 0 0 1 12 8.5c1.93 0 3.5 1.57 3.5 3.5 0 .47-.09.92-.26 1.33" />
														<path d="M14.47 14.47A3.5 3.5 0 0 1 12 15.5c-1.93 0-3.5-1.57-3.5-3.5 0-.47.09-.92.26-1.33" />
													</svg>
												)}
											</button>
										</span>
										{registerForm.formState.errors.confirmPassword && (
											<div className="error-message">
												<FaInfoCircle className="error-icon" />
												{registerForm.formState.errors.confirmPassword.message}
											</div>
										)}
									</div>
									<div
										className="checkout-container__terms-checkbox"
										style={{ alignItems: "center" }}
									>
										<input
											type="checkbox"
											id="signupcheckbox"
											checked={termsAgreed}
											onChange={handleTermsChange}
											className="checkout-container__terms-checkbox-input"
											required
											style={{
												boxShadow: "none",
												height: "fit-content",
												width: "fit-content",
												scale: "1.5",
												marginRight: "10px",
												marginLeft: "4px",
											}}
										/>
										<label htmlFor="signupcheckbox">
											I have read and agree to the website{" "}
											<Link
												href="/terms"
												rel="noopener noreferrer"
												style={{
													color: "#ff7e5f",
													textDecoration: "underline",
												}}
											>
												terms and conditions
											</Link>{" "}
											*
										</label>
									</div>
								</div>
							)}

							<button
								type="submit"
								className="auth-modal__submit"
								disabled={isLoading}
							>
								{isLoading ? "Loading..." : isLoginMode ? "LOG IN" : "SIGN UP"}
							</button>
						</>
					)}
				</form>

				{!showVerification && isLoginMode && (
					<div className="auth-modal__footer">
						<p className="auth-modal__footer-text">
							Don't have an account?{" "}
							<button
								type="button"
								className="auth-modal__link-button"
								onClick={() => setIsLoginMode(false)}
							>
								Sign up
							</button>
						</p>
					</div>
				)}

				{!showVerification && !isLoginMode && (
					<div className="auth-modal__footer">
						<p className="auth-modal__footer-text">
							Already have an account?{" "}
							<button
								type="button"
								className="auth-modal__link-button"
								onClick={() => setIsLoginMode(true)}
							>
								Log in
							</button>
						</p>
					</div>
				)}
			</div>

			{showForgotPopup && (
				<div className="auth-modal__popup-overlay">
					<div
						className="auth-modal__popup"
						ref={popupRef}
					>
						{forgotMode === "request" ? (
							<form
								className="auth-modal__form"
								onSubmit={handleForgotPasswordRequest}
							>
								<h2 className="auth-modal__title">Forgot Password</h2>
								<p className="auth-modal__desc">
									Enter your email to receive a password reset link.
								</p>
								<input
									type="email"
									className="auth-modal__input"
									placeholder="Email"
									{...forgotPasswordForm.register("email")}
								/>
								{forgotPasswordForm.formState.errors.email && (
									<div className="error-message">
										<FaInfoCircle className="error-icon" />
										{forgotPasswordForm.formState.errors.email.message}
									</div>
								)}
								{error && <div className="auth-modal__error">{error}</div>}
								{success && (
									<div className="auth-modal__success">{success}</div>
								)}
								<button
									className="auth-modal__button"
									type="submit"
									disabled={isLoading}
								>
									{isLoading ? "Sending..." : "Send Reset Email"}
								</button>
								<button
									type="button"
									className="auth-modal__link"
									onClick={() => {
										setShowForgotPopup(false);
										setForgotMode("none");
										setError("");
										setSuccess("");
										forgotPasswordForm.reset();
									}}
									style={{ marginTop: 8 }}
								>
									Cancel
								</button>
							</form>
						) : forgotMode === "reset" ? (
							<form
								className="auth-modal__form"
								onSubmit={handleResetPassword}
							>
								<h2 className="auth-modal__title">Reset Password</h2>
								<p className="auth-modal__desc">
									Enter the token sent to your email and your new password.
								</p>
								<input
									type="text"
									className="auth-modal__input"
									placeholder="Reset Token"
									value={resetPasswordForm.watch('password') || ''}
									onChange={(e) => resetPasswordForm.setValue('password', e.target.value)}
									required
								/>
								<div
									className="auth-modal__form-group"
									style={{ position: "relative" }}
								>
									<input
										type={showPassword ? "text" : "password"}
										className="auth-modal__input"
										placeholder="New Password"
										{...resetPasswordForm.register("password")}
										required
									/>
									{resetPasswordForm.formState.errors.password && (
										<div className="error-message">
											<FaInfoCircle className="error-icon" />
											{resetPasswordForm.formState.errors.password.message}
										</div>
									)}
									<button
										type="button"
										onClick={togglePasswordVisibility}
										style={{
											position: "absolute",
											right: "10px",
											top: "50%",
											transform: "translateY(-50%)",
											background: "none",
											border: "none",
											cursor: "pointer",
											padding: "0",
											fontSize: "16px",
										}}
									>
										{showPassword ? (
											<svg
												width="20"
												height="20"
												viewBox="0 0 24 24"
												fill="none"
												stroke="#888"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
											>
												<ellipse
													cx="12"
													cy="12"
													rx="10"
													ry="7"
												/>
												<circle
													cx="12"
													cy="12"
													r="3.5"
												/>
											</svg>
										) : (
											<svg
												width="20"
												height="20"
												viewBox="0 0 24 24"
												fill="none"
												stroke="#888"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
											>
												<path d="M1 1l22 22" />
												<path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.11 1 12c.74-1.32 1.81-2.87 3.11-4.19M9.53 9.53A3.5 3.5 0 0 1 12 8.5c1.93 0 3.5 1.57 3.5 3.5 0 .47-.09.92-.26 1.33" />
												<path d="M14.47 14.47A3.5 3.5 0 0 1 12 15.5c-1.93 0-3.5-1.57-3.5-3.5 0-.47.09-.92.26-1.33" />
											</svg>
										)}
									</button>
								</div>
								<div
									className="auth-modal__form-group"
									style={{ position: "relative" }}
								>
									<input
										type={showConfirmPassword ? "text" : "password"}
										className="auth-modal__input"
										placeholder="Confirm New Password"
										{...resetPasswordForm.register("confirmPassword")}
										required
									/>
									{resetPasswordForm.formState.errors.confirmPassword && (
										<div className="error-message">
											<FaInfoCircle className="error-icon" />
											{resetPasswordForm.formState.errors.confirmPassword.message}
										</div>
									)}
									<button
										type="button"
										onClick={toggleConfirmPasswordVisibility}
										style={{
											position: "absolute",
											right: "10px",
											top: "50%",
											transform: "translateY(-50%)",
											background: "none",
											border: "none",
											cursor: "pointer",
											padding: "0",
											fontSize: "16px",
										}}
									>
										{showConfirmPassword ? (
											<svg
												width="20"
												height="20"
												viewBox="0 0 24 24"
												fill="none"
												stroke="#888"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
											>
												<ellipse
													cx="12"
													cy="12"
													rx="10"
													ry="7"
												/>
												<circle
													cx="12"
													cy="12"
													r="3.5"
												/>
											</svg>
										) : (
											<svg
												width="20"
												height="20"
												viewBox="0 0 24 24"
												fill="none"
												stroke="#888"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
											>
												<path d="M1 1l22 22" />
												<path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.11 1 12c.74-1.32 1.81-2.87 3.11-4.19M9.53 9.53A3.5 3.5 0 0 1 12 8.5c1.93 0 3.5 1.57 3.5 3.5 0 .47-.09.92-.26 1.33" />
												<path d="M14.47 14.47A3.5 3.5 0 0 1 12 15.5c-1.93 0-3.5-1.57-3.5-3.5 0-.47.09-.92.26-1.33" />
											</svg>
										)}
									</button>
								</div>
								{error && <div className="auth-modal__error">{error}</div>}
								{success && (
									<div className="auth-modal__success">{success}</div>
								)}
								<button
									className="auth-modal__button"
									type="submit"
									disabled={isLoading}
								>
									{isLoading ? "Resetting..." : "Reset Password"}
								</button>
								<button
									type="button"
									className="auth-modal__link"
									onClick={() => {
										setShowForgotPopup(false);
										setForgotMode("none");
										setError("");
										setSuccess("");
										resetPasswordForm.reset();
									}}
									style={{ marginTop: 8 }}
								>
									Cancel
								</button>
							</form>
						) : null}
					</div>
				</div>
			)}
		</div>,
		document.body
	);
};

export default AuthModal;
