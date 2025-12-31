'use client';

import { TbTruckDelivery } from "react-icons/tb";
import {
	FaPhoneVolume,
	FaLocationDot,
	FaFacebookF,
	FaInstagram,
} from "react-icons/fa6";
import { MdEmail } from "react-icons/md";
import { IoLogoWhatsapp } from "react-icons/io";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import OrderTrackingModal from "./Modal/OrderTrackingModal";
import { OrderService } from "@/lib/services/orderService";

const Footer: React.FC = () => {
	const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
	const [orderId, setOrderId] = useState("");
	const [email, setEmail] = useState("");
	const [trackingResult, setTrackingResult] = useState<{
		success: boolean;
		orderStatus?: string;
		message?: string;
	} | null>(null);

	const handleTrackOrder = async () => {
		if (!orderId.trim() || !email.trim()) {
			setTrackingResult({
				success: false,
				message: "Please enter both Order ID and Email",
			});
			setIsTrackingModalOpen(true);
			return;
		}
		try {
			const result = await OrderService.trackOrder(parseInt(orderId), email);
			setTrackingResult({
				success: true,
				orderStatus: result.orderStatus,
			});
			setIsTrackingModalOpen(true);
		} catch (error) {
			console.error("Order tracking error:", error);
			setTrackingResult({
				success: false,
				message:
					error instanceof Error
						? error.message
						: "An error occurred while tracking the order",
			});
			setIsTrackingModalOpen(true);
		}
	};

	return (
		<footer className="w-full relative overflow-hidden bg-[#f8f8f8] text-[#333] border-t border-[#eee]">
			<div className="max-w-[1800px] mx-auto w-[85%] overflow-hidden">
				<div className="w-full mx-auto">
					{/* First Div: Track Order, Useful Links, Account, Quick Access */}
					<div className="flex flex-row flex-wrap gap-[30px] md:flex-col md:gap-5 sm:gap-[15px]">
						{/* Track Order Section */}
						<div className="mb-[30px] w-full flex-1 min-w-[300px] max-w-full pr-[60px] text-left md:pr-[30px] sm:mb-5 xs:mb-[15px]">
							<h2 className="text-2xl font-semibold mb-[15px] text-black sm:text-xl sm:mb-[10px] xs:text-[15px]">Track your Order</h2>
							<p className="text-[15px] leading-[1.5] mb-5 text-[#555] max-w-[700px] sm:text-sm sm:mb-[15px]">
								To track your order please enter your Order ID in the box below
								and press the "Track" button. This was given to you on your
								receipt and in the confirmation email you should have received.
							</p>
							<div className="mt-[10px] w-full">
								<div className="flex flex-wrap gap-5 mb-5 w-full sm:flex-col sm:gap-3 xs:gap-[10px]">
									<div className="max-w-[300px] w-full mb-4 sm:mb-3 xs:mb-[10px]">
										<label className="block font-semibold mb-[6px] text-[#333] text-sm">Order ID</label>
										<p className="text-[13px] text-[#777] m-0 mb-2">
											Found in your order confirmation email
										</p>
										<input
											type="text"
											className="w-full px-4 py-3 border-2 border-[#e1e5e9] rounded-lg text-sm max-w-full bg-white transition-all duration-300 cursor-pointer text-[#333] hover:border-[#ff6f00] hover:bg-[#fafafa] focus:outline-none focus:border-[#ff6f00] focus:shadow-[0_0_0_3px_rgba(255,111,0,0.1)] placeholder:text-[#999] placeholder:italic sm:text-base"
											placeholder="Enter your Order ID"
											value={orderId}
											onChange={(e) => setOrderId(e.target.value)}
										/>
									</div>
									<div className="max-w-[300px] w-full mb-4 sm:mb-3 xs:mb-[10px]">
										<label className="block font-semibold mb-[6px] text-[#333] text-sm">Billing email</label>
										<p className="text-[13px] text-[#777] m-0 mb-2">Email you used check out.</p>
										<input
											type="email"
											className="w-full px-4 py-3 border-2 border-[#e1e5e9] rounded-lg text-sm max-w-full bg-white transition-all duration-300 cursor-pointer text-[#333] hover:border-[#ff6f00] hover:bg-[#fafafa] focus:outline-none focus:border-[#ff6f00] focus:shadow-[0_0_0_3px_rgba(255,111,0,0.1)] placeholder:text-[#999] placeholder:italic sm:text-base"
											placeholder="Enter your email"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
										/>
									</div>
								</div>
								<button
									className="bg-gradient-to-br from-[#ff6f00] to-[#e56500] text-white border-none rounded-lg px-8 py-[14px] text-base font-semibold cursor-pointer transition-all duration-300 max-w-full flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(255,111,0,0.3)] uppercase tracking-[0.5px] hover:bg-gradient-to-br hover:from-[#e56500] hover:to-[#d45a00] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(255,111,0,0.4)] active:translate-y-0 active:shadow-[0_2px_4px_rgba(255,111,0,0.3)] disabled:bg-[#6c757d] disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none sm:w-full sm:px-5 sm:text-[15px]"
									onClick={handleTrackOrder}
									disabled={!orderId.trim()}
								>
									<span className="text-lg">📦</span>
									Track Order
								</button>
							</div>
						</div>

						{/* Links Sections */}
						<div className="flex flex-col justify-start flex-1 w-full gap-[30px]">
							<div className="grid grid-cols-3 gap-[30px] lg:grid-cols-2 sm:grid-cols-2 sm:gap-y-[10px] sm:gap-x-[15px] xs:gap-y-[10px] xs:gap-x-3">
								{/* Useful Links Section */}
								<div className="mb-[30px] w-full text-left sm:mb-[15px] xs:mb-3 sm:col-start-1 sm:row-start-1 xs:col-start-1 xs:row-start-1">
									<h3 className="text-lg font-semibold mb-5 text-black relative inline-block sm:text-base sm:mb-3 xs:text-[15px] xs:mb-[10px]">Useful Links</h3>
									<ul className="list-none p-0 m-0 text-left">
										<li className="mb-3 sm:mb-2 xs:mb-[6px]">
											<Link
												href="/privacy"
												className="text-[#555] no-underline text-[15px] transition-colors duration-200 hover:text-[#ff6f00]"
											>
												Privacy Policy
											</Link>
										</li>
										<li className="mb-3 sm:mb-2 xs:mb-[6px]">
											<Link
												href="/terms"
												className="text-[#555] no-underline text-[15px] transition-colors duration-200 hover:text-[#ff6f00]"
											>
												Terms & <br />
												Condition
											</Link>
										</li>
										<li className="mb-3 sm:mb-2 xs:mb-[6px]">
											<Link
												href="/becomevendor"
												className="text-[#555] no-underline text-[15px] transition-colors duration-200 hover:text-[#ff6f00]"
											>
												Become a <br />
												vendor
											</Link>
										</li>
										<li className="mb-3 sm:mb-2 xs:mb-[6px]">
											<Link
												href="/return-refund-policy"
												className="text-[#555] no-underline text-[15px] transition-colors duration-200 hover:text-[#ff6f00]"
											>
												Return Policy
											</Link>
										</li>
									</ul>
								</div>

								{/* Quick Access Section */}
								<div className="mb-[30px] w-full text-left sm:mb-[15px] xs:mb-3 sm:col-start-2 sm:row-start-1 xs:col-start-2 xs:row-start-1">
									<h3 className="text-lg font-semibold mb-5 text-black relative inline-block sm:text-base sm:mb-3 xs:text-[15px] xs:mb-[10px]">Quick Access</h3>
									<ul className="list-none p-0 m-0 text-left">
										<li className="mb-3 sm:mb-2 xs:mb-[6px]">
											<Link
												href="/shop"
												className="text-[#555] no-underline text-[15px] transition-colors duration-200 hover:text-[#ff6f00]"
											>
												Shop
											</Link>
										</li>
										<li className="mb-3 sm:mb-2 xs:mb-[6px]">
											<Link
												href="/contact"
												className="text-[#555] no-underline text-[15px] transition-colors duration-200 hover:text-[#ff6f00]"
											>
												Contact Us
											</Link>
										</li>
										<li className="mb-3 sm:mb-2 xs:mb-[6px]">
											<Link
												href="/about"
												className="text-[#555] no-underline text-[15px] transition-colors duration-200 hover:text-[#ff6f00]"
											>
												About Us
											</Link>
										</li>
										<li className="mb-3 sm:mb-2 xs:mb-[6px]">
											<Link
												href="/faq"
												className="text-[#555] no-underline text-[15px] transition-colors duration-200 hover:text-[#ff6f00]"
											>
												FAQ
											</Link>
										</li>
									</ul>
								</div>

								{/* Account Section */}
								<div className="mb-[30px] w-full text-left sm:mb-[15px] xs:mb-3 sm:col-span-2 sm:row-start-2 xs:col-span-2 xs:row-start-2">
									<h3 className="text-lg font-semibold mb-5 text-black relative inline-block sm:text-base sm:mb-3 xs:text-[15px] xs:mb-[10px]">Account</h3>
									<ul className="list-none p-0 m-0 text-left">
										<li className="mb-3 sm:mb-2 xs:mb-[6px]">
											<Link
												href="/wishlist"
												className="text-[#555] no-underline text-[15px] transition-colors duration-200 hover:text-[#ff6f00]"
											>
												Wishlist
											</Link>
										</li>
										<li className="mb-3 sm:mb-2 xs:mb-[6px]">
											<Link
												href="/contact"
												className="text-[#555] no-underline text-[15px] transition-colors duration-200 hover:text-[#ff6f00]"
											>
												Complain
											</Link>
										</li>
									</ul>
								</div>
							</div>
						</div>
					</div>

					{/* Second Div: Three Cards in a Row */}
					<div className="flex justify-center items-stretch gap-5 border-t border-[#e1e5e9] pt-10 mt-[25px] flex-wrap w-full max-w-[1200px] mx-auto sm:flex-col sm:items-center sm:gap-[15px] sm:pt-[25px] sm:mt-[15px] xs:gap-3 xs:pt-5 xs:mt-3">
						{/* Services Section */}
						<div className="relative mb-5 p-[30px_20px] bg-gradient-to-br from-[rgba(255,111,0,0.03)] to-[rgba(229,101,0,0.03)] rounded-[20px] border border-[rgba(255,111,0,0.15)] text-center w-full max-w-[380px] min-h-[240px] flex flex-col justify-between items-center transition-all duration-[400ms] shadow-[0_4px_15px_rgba(0,0,0,0.05)] hover:-translate-y-1 hover:shadow-[0_12px_35px_rgba(255,111,0,0.18)] hover:border-[rgba(255,111,0,0.3)] hover:bg-gradient-to-br hover:from-[rgba(255,111,0,0.05)] hover:to-[rgba(229,101,0,0.05)] sm:w-full sm:max-w-full sm:min-h-[180px] sm:p-[20px_15px] sm:mb-[15px] xs:min-h-[160px] xs:p-[15px_12px] xs:mb-3">
							<h3 className="text-[19px] font-bold mb-[25px] text-[#222] relative inline-block uppercase tracking-[0.5px] after:content-[''] after:absolute after:bottom-[-5px] after:left-0 after:w-full after:h-[2px] after:bg-gradient-to-r after:from-[#ff6f00] after:to-transparent after:rounded-[1px] sm:mb-[15px] sm:text-base xs:text-[15px] xs:mb-3">Services</h3>
							<div className="grid grid-cols-2 gap-[18px] w-full max-w-[320px] mx-auto md:grid-cols-1 sm:grid-cols-2 sm:gap-[10px] sm:max-w-full xs:gap-2">
								<div className="flex items-center justify-start mb-0 w-full p-[6px_8px] rounded-[10px] transition-all duration-300 hover:bg-[rgba(255,111,0,0.08)] hover:scale-[1.02]">
									<div className="w-7 h-7 min-w-[28px] mr-2 rounded-full bg-[#ff6f00] flex items-center justify-center text-white text-sm flex-shrink-0 shadow-[0_2px_8px_rgba(255,111,0,0.3)] sm:mr-[2px] xs:mr-[6px] xs:w-[26px] xs:h-[26px] xs:min-w-[26px] xs:text-[13px]">
										<TbTruckDelivery />
									</div>
									<div className="flex flex-col break-words flex-1 leading-[1.3] text-left">
										<div className="font-bold mb-[2px] text-[#222] text-[13px]">Delivery</div>
										<div className="text-[#666] text-[13px] mt-0 font-medium xs:text-[11px]">All over Nepal</div>
									</div>
								</div>
								<div className="flex items-center justify-start mb-0 w-full p-[6px_8px] rounded-[10px] transition-all duration-300 hover:bg-[rgba(255,111,0,0.08)] hover:scale-[1.02]">
									<div className="w-7 h-7 min-w-[28px] mr-2 rounded-full bg-[#ff6f00] flex items-center justify-center text-white text-sm flex-shrink-0 shadow-[0_2px_8px_rgba(255,111,0,0.3)] sm:mr-[2px] xs:mr-[6px] xs:w-[26px] xs:h-[26px] xs:min-w-[26px] xs:text-[13px]">
										<FaPhoneVolume />
									</div>
									<div className="flex flex-col break-words flex-1 leading-[1.3] text-left">
										<div className="font-bold mb-[2px] text-[#222] text-[13px]">Phone</div>
										<div className="text-[#666] text-[13px] mt-0 font-medium xs:text-[11px]">9700620004</div>
									</div>
								</div>
								<div className="flex items-center justify-start mb-0 w-full p-[6px_8px] rounded-[10px] transition-all duration-300 hover:bg-[rgba(255,111,0,0.08)] hover:scale-[1.02]">
									<div className="w-7 h-7 min-w-[28px] mr-2 rounded-full bg-[#ff6f00] flex items-center justify-center text-white text-sm flex-shrink-0 shadow-[0_2px_8px_rgba(255,111,0,0.3)] sm:mr-[2px] xs:mr-[6px] xs:w-[26px] xs:h-[26px] xs:min-w-[26px] xs:text-[13px]">
										<FaPhoneVolume />
									</div>
									<div className="flex flex-col break-words flex-1 leading-[1.3] text-left">
										<div className="font-bold mb-[2px] text-[#222] text-[13px]">Landline</div>
										<div className="text-[#666] text-[13px] mt-0 font-medium whitespace-nowrap xs:text-[11px]">
											01-4720234
										</div>
									</div>
								</div>
								<div className="flex items-center justify-start mb-0 w-full p-[6px_8px] rounded-[10px] transition-all duration-300 hover:bg-[rgba(255,111,0,0.08)] hover:scale-[1.02]">
									<div className="w-7 h-7 min-w-[28px] mr-2 rounded-full bg-[#ff6f00] flex items-center justify-center text-white text-sm flex-shrink-0 shadow-[0_2px_8px_rgba(255,111,0,0.3)] sm:mr-[2px] xs:mr-[6px] xs:w-[26px] xs:h-[26px] xs:min-w-[26px] xs:text-[13px]">
										<FaLocationDot />
									</div>
									<div className="flex flex-col break-words flex-1 leading-[1.3] text-left">
										<div className="font-bold mb-[2px] text-[#222] text-[13px]">Address</div>
										<div className="text-[#666] text-[13px] mt-0 font-medium xs:text-[11px]">
											Kathmandu, Nepal
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Contact With Us Section */}
						<div className="relative mb-5 p-[30px_20px] bg-gradient-to-br from-[rgba(255,111,0,0.03)] to-[rgba(229,101,0,0.03)] rounded-[20px] border border-[rgba(255,111,0,0.15)] text-center w-full max-w-[380px] min-h-[240px] flex flex-col justify-between items-center transition-all duration-[400ms] shadow-[0_4px_15px_rgba(0,0,0,0.05)] hover:-translate-y-1 hover:shadow-[0_12px_35px_rgba(255,111,0,0.18)] hover:border-[rgba(255,111,0,0.3)] hover:bg-gradient-to-br hover:from-[rgba(255,111,0,0.05)] hover:to-[rgba(229,101,0,0.05)] sm:w-full sm:max-w-full sm:min-h-[180px] sm:p-[20px_15px] sm:mb-[15px] xs:min-h-[160px] xs:p-[15px_12px] xs:mb-3">
							<h3 className="text-[19px] font-bold mb-[25px] text-[#222] relative inline-block uppercase tracking-[0.5px] after:content-[''] after:absolute after:bottom-[-5px] after:left-0 after:w-full after:h-[2px] after:bg-gradient-to-r after:from-[#ff6f00] after:to-transparent after:rounded-[1px] sm:mb-[15px] sm:text-base xs:text-[15px] xs:mb-3">Contact With Us</h3>
							<div className="flex-1 flex items-center justify-center gap-[15px] flex-wrap m-0 sm:gap-3 xs:gap-[10px]">
								<a
									href="https://www.facebook.com/"
									className="w-[52px] h-[52px] rounded-[15px] bg-white border-2 border-[#e1e5e9] flex items-center justify-center text-[#ff6f00] text-[22px] transition-all duration-[400ms] no-underline relative overflow-hidden shadow-[0_3px_10px_rgba(0,0,0,0.08)] before:content-[''] before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-[rgba(255,111,0,0.1)] before:to-transparent before:transition-[left] before:duration-500 hover:border-[#1877f2] hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(24,119,242,0.25)] hover:bg-gradient-to-br hover:from-[#1877f2] hover:to-[#0c5fcd] hover:text-white hover:before:left-full sm:w-10 sm:h-10 sm:text-base"
									target="_blank"
									rel="noopener noreferrer"
								>
									<FaFacebookF />
								</a>
								<a
									href="mailto:Dajuvai106@gmail.com"
									className="w-[52px] h-[52px] rounded-[15px] bg-white border-2 border-[#e1e5e9] flex items-center justify-center text-[#ff6f00] text-[22px] transition-all duration-[400ms] no-underline relative overflow-hidden shadow-[0_3px_10px_rgba(0,0,0,0.08)] before:content-[''] before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-[rgba(255,111,0,0.1)] before:to-transparent before:transition-[left] before:duration-500 hover:border-[#ea4335] hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(234,67,53,0.25)] hover:bg-gradient-to-br hover:from-[#ea4335] hover:to-[#d33b2c] hover:text-white hover:before:left-full sm:w-10 sm:h-10 sm:text-base"
									target="_blank"
									rel="noopener noreferrer"
								>
									<MdEmail />
								</a>
								<a
									href="https://wa.me/+9779700620004"
									className="w-[52px] h-[52px] rounded-[15px] bg-white border-2 border-[#e1e5e9] flex items-center justify-center text-[#ff6f00] text-[22px] transition-all duration-[400ms] no-underline relative overflow-hidden shadow-[0_3px_10px_rgba(0,0,0,0.08)] before:content-[''] before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-[rgba(255,111,0,0.1)] before:to-transparent before:transition-[left] before:duration-500 hover:border-[#25d366] hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(37,211,102,0.25)] hover:bg-gradient-to-br hover:from-[#25d366] hover:to-[#128c7e] hover:text-white hover:before:left-full sm:w-10 sm:h-10 sm:text-base"
									target="_blank"
									rel="noooopener noreferrer"
								>
									<IoLogoWhatsapp />
								</a>
								<a
									href="https://www.instagram.com/dajuvai_/"
									className="w-[52px] h-[52px] rounded-[15px] bg-white border-2 border-[#e1e5e9] flex items-center justify-center text-[#ff6f00] text-[22px] transition-all duration-[400ms] no-underline relative overflow-hidden shadow-[0_3px_10px_rgba(0,0,0,0.08)] before:content-[''] before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-[rgba(255,111,0,0.1)] before:to-transparent before:transition-[left] before:duration-500 hover:border-[#e4405f] hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(228,64,95,0.25)] hover:bg-gradient-to-br hover:from-[#e4405f] hover:via-[#833ab4] hover:to-[#f56040] hover:text-white hover:before:left-full sm:w-10 sm:h-10 sm:text-base"
									target="_blank"
									rel="noopener noreferrer"
								>
									<FaInstagram />
								</a>
							</div>
						</div>

						{/* Payment Methods Section */}
						<div className="relative mb-5 p-[30px_20px] bg-gradient-to-br from-[rgba(255,111,0,0.03)] to-[rgba(229,101,0,0.03)] rounded-[20px] border border-[rgba(255,111,0,0.15)] text-center w-full max-w-[380px] min-h-[240px] flex flex-col justify-between items-center transition-all duration-[400ms] shadow-[0_4px_15px_rgba(0,0,0,0.05)] hover:-translate-y-1 hover:shadow-[0_12px_35px_rgba(255,111,0,0.18)] hover:border-[rgba(255,111,0,0.3)] hover:bg-gradient-to-br hover:from-[rgba(255,111,0,0.05)] hover:to-[rgba(229,101,0,0.05)] sm:w-full sm:max-w-full sm:min-h-[180px] sm:p-[20px_15px] sm:mb-[15px] xs:min-h-[160px] xs:p-[15px_12px] xs:mb-3">
							<h3 className="text-[19px] font-bold mb-[25px] text-[#222] relative inline-block uppercase tracking-[0.5px] after:content-[''] after:absolute after:bottom-[-5px] after:left-0 after:w-full after:h-[2px] after:bg-gradient-to-r after:from-[#ff6f00] after:to-transparent after:rounded-[1px] sm:mb-[15px] sm:text-base xs:text-[15px] xs:mb-3">Payment Methods</h3>
							<div className="flex-1 flex items-center justify-center gap-[15px] flex-wrap m-0 sm:gap-3 xs:gap-[10px]">
								<Image
									src="/assets/esewa.png"
									alt="eSewa Payment"
									width={80}
									height={40}
									className="h-[52px] max-w-[90px] object-contain p-[10px_15px] bg-white rounded-[15px] border-2 border-[#e1e5e9] transition-all duration-[400ms] cursor-pointer relative overflow-hidden shadow-[0_3px_10px_rgba(0,0,0,0.08)] before:content-[''] before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-[rgba(255,111,0,0.1)] before:to-transparent before:transition-[left] before:duration-500 hover:border-[#ff6f00] hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(255,111,0,0.25)] hover:before:left-full sm:h-9 sm:max-w-[65px] sm:p-[8px_10px]"
								/>
								<Image
									src="/assets/npx.png"
									alt="NPX Payment"
									width={80}
									height={40}
									className="h-[52px] max-w-[90px] object-contain p-[10px_15px] bg-white rounded-[15px] border-2 border-[#e1e5e9] transition-all duration-[400ms] cursor-pointer relative overflow-hidden shadow-[0_3px_10px_rgba(0,0,0,0.08)] before:content-[''] before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-[rgba(255,111,0,0.1)] before:to-transparent before:transition-[left] before:duration-500 hover:border-[#ff6f00] hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(255,111,0,0.25)] hover:before:left-full sm:h-9 sm:max-w-[65px] sm:p-[8px_10px]"
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Copyright Section */}
				<div className="mt-[30px] mx-auto mb-0 p-[20px_15px] border-t border-[#eee] flex justify-center items-center flex-wrap gap-[15px] w-full max-w-[95%] sm:flex-col sm:text-center sm:mt-5 sm:p-[15px_10px] xs:mt-[15px] xs:p-[12px_8px]">
					<div className="text-sm text-[#666] text-center pb-0 md:pb-20 sm:pb-[60px] xs:pb-[50px] xs:text-[13px]">
						Copyright Dajuvai © 2025
					</div>
				</div>
			</div>

			{/* Order Tracking Modal */}
			<OrderTrackingModal
				isOpen={isTrackingModalOpen}
				onClose={() => setIsTrackingModalOpen(false)}
				trackingResult={trackingResult}
			/>
		</footer>
	);
};

export default Footer;
