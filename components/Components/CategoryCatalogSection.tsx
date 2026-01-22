'use client';

import React, { useEffect, useState, useRef } from "react";
import { fetchCategoryCatalog } from "@/lib/api/categoryCatalog";
import {
	IoIosArrowDropleftCircle,
	IoIosArrowDroprightCircle,
} from "react-icons/io";
import "@/styles/CategoryCatalogSection.css";

interface Subcategory {
	id: number;
	name: string;
	image: string;
}

interface Category {
	category: {
		id: number;
		name: string;
		image: string;
		subcategories: Subcategory[];
	};
}

const CategoryCatalogSection: React.FC = () => {
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const subcatRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
	const [scrollState, setScrollState] = useState<{
		[key: number]: { hasOverflow: boolean; atStart: boolean; atEnd: boolean };
	}>({});
	const [isDragging, setIsDragging] = useState<{ [key: number]: boolean }>({});
	const [startX, setStartX] = useState<{ [key: number]: number }>({});
	const [scrollLeft, setScrollLeft] = useState<{ [key: number]: number }>({});
	const [showScrollButtons, setShowScrollButtons] = useState<boolean>(true);

	useEffect(() => {
		const loadCategories = async () => {
			try {
				//("Fetching category catalog...");
				const data = await fetchCategoryCatalog();
				//("Raw data from fetchCategoryCatalog:", data);
				const processedCategories = Array.isArray(data) ? data : [];
				setCategories(processedCategories);

			} catch (err) {
				console.error("Error fetching category catalog:", err);
				setError(err instanceof Error ? err.message : "Unknown error");
			} finally {
				//("Loading state set to false");
				setLoading(false);
			}
		};
		loadCategories();
	}, []);

	useEffect(() => {
		const checkWidth = (): void => {
			setShowScrollButtons(window.innerWidth >= 768);
		};

		const checkScrollState = () => {
			const newScrollState: {
				[key: number]: {
					hasOverflow: boolean;
					atStart: boolean;
					atEnd: boolean;
				};
			} = {};
			categories.forEach((category) => {
				const catId = category.category.id;
				const el = subcatRefs.current[catId];
				if (el) {
					newScrollState[catId] = {
						hasOverflow: el.scrollWidth > el.clientWidth,
						atStart: el.scrollLeft === 0,
						atEnd: el.scrollLeft >= el.scrollWidth - el.clientWidth - 1,
					};
				}
			});
			setScrollState(newScrollState);
		};

		checkWidth();
		checkScrollState();
		window.addEventListener("resize", checkWidth);
		window.addEventListener("resize", checkScrollState);
		categories.forEach((category) => {
			const catId = category.category.id;
			const el = subcatRefs.current[catId];
			if (el) {
				el.addEventListener("scroll", checkScrollState);
			}
		});

		return () => {
			window.removeEventListener("resize", checkWidth);
			window.removeEventListener("resize", checkScrollState);
			categories.forEach((category) => {
				const catId = category.category.id;
				const el = subcatRefs.current[catId];
				if (el) {
					el.removeEventListener("scroll", checkScrollState);
				}
			});
		};
	}, [categories]);

	const scroll = (catId: number, direction: "left" | "right"): void => {
		const el = subcatRefs.current[catId];
		if (el) {
			const scrollDistance =
				direction === "left" ? -el.clientWidth : el.clientWidth;
			el.scrollBy({
				left: scrollDistance,
				behavior: "smooth",
			});
		}
	};

	const handleTouchStart = (
		catId: number,
		e: React.TouchEvent<HTMLDivElement>
	): void => {
		const el = subcatRefs.current[catId];
		const touch = e.touches[0];
		if (el && touch) {
			setIsDragging((prev) => ({ ...prev, [catId]: true }));
			setStartX((prev) => ({ ...prev, [catId]: touch.clientX }));
			setScrollLeft((prev) => ({ ...prev, [catId]: el.scrollLeft }));
			el.style.pointerEvents = "auto";
		}
	};

	const handleTouchMove = (
		catId: number,
		e: React.TouchEvent<HTMLDivElement>
	): void => {
		const touch = e.touches[0];
		const startXValue = startX[catId];
		const scrollLeftValue = scrollLeft[catId];
		if (!isDragging[catId] || !subcatRefs.current[catId] || !touch || startXValue === undefined || scrollLeftValue === undefined) return;
		e.preventDefault();
		const x = touch.clientX;
		const walk = (startXValue - x) * 2;
		subcatRefs.current[catId]!.scrollLeft = scrollLeftValue + walk;
	};

	const handleTouchEnd = (catId: number): void => {
		setIsDragging((prev) => ({ ...prev, [catId]: false }));
		if (subcatRefs.current[catId]) {
			subcatRefs.current[catId]!.style.pointerEvents = "auto";
		}
	};

	const handleMouseDown = (
		catId: number,
		e: React.MouseEvent<HTMLDivElement>
	): void => {
		if (e.button !== 0) return;
		const el = subcatRefs.current[catId];
		if (el) {
			setIsDragging((prev) => ({ ...prev, [catId]: true }));
			setStartX((prev) => ({ ...prev, [catId]: e.pageX - el.offsetLeft }));
			setScrollLeft((prev) => ({ ...prev, [catId]: el.scrollLeft }));
			el.style.cursor = "grabbing";
			e.preventDefault();
		}
	};

	const handleMouseMove = (
		catId: number,
		e: React.MouseEvent<HTMLDivElement>
	): void => {
		const startXValue = startX[catId];
		const scrollLeftValue = scrollLeft[catId];
		if (!isDragging[catId] || !subcatRefs.current[catId] || startXValue === undefined || scrollLeftValue === undefined) return;
		e.preventDefault();
		const x = e.pageX - subcatRefs.current[catId]!.offsetLeft;
		const walk = (x - startXValue) * 2;
		subcatRefs.current[catId]!.scrollLeft = scrollLeftValue - walk;
	};

	const handleMouseUp = (catId: number): void => {
		setIsDragging((prev) => ({ ...prev, [catId]: false }));
		if (subcatRefs.current[catId]) {
			subcatRefs.current[catId]!.style.cursor = "grab";
			subcatRefs.current[catId]!.style.pointerEvents = "auto";
		}
	};

	const handleMouseLeave = (catId: number): void => {
		if (isDragging[catId]) {
			setIsDragging((prev) => ({ ...prev, [catId]: false }));
			if (subcatRefs.current[catId]) {
				subcatRefs.current[catId]!.style.cursor = "grab";
				subcatRefs.current[catId]!.style.pointerEvents = "auto";
			}
		}
	};

	if (loading)
		return <div className="category-section__title-skeleton skeleton"></div>;
	if (error) return <div>Error: {error}</div>;

	return (
		<div className="category-section">
			{categories.map((category) => {
				const catId = category.category.id;
				const { hasOverflow, atStart, atEnd } = scrollState[catId] || {
					hasOverflow: false,
					atStart: true,
					atEnd: false,
				};
				return (
					<div
						key={catId}
						className="category-section__category"
					>
						<div className="category-section__header">
							<h2 className="category-section__title">
								{category.category.name}
							</h2>
						</div>
						<div className="category-section__carousel-container">
							{showScrollButtons && hasOverflow && !atStart && (
								<button
									className="category-section__scroll-button category-section__scroll-button--left"
									onClick={() => scroll(catId, "left")}
								>
									<IoIosArrowDropleftCircle />
								</button>
							)}
							{showScrollButtons && hasOverflow && !atEnd && (
								<button
									className="category-section__scroll-button category-section__scroll-button--right"
									onClick={() => scroll(catId, "right")}
								>
									<IoIosArrowDroprightCircle />
								</button>
							)}
							<div
								className={`category-section__subcategories ${isDragging[catId]
									? "category-section__subcategories--dragging"
									: ""
									}`}
								ref={(el) => {
									subcatRefs.current[catId] = el;
								}}
								onMouseDown={(e) => handleMouseDown(catId, e)}
								onMouseMove={(e) => handleMouseMove(catId, e)}
								onMouseUp={() => handleMouseUp(catId)}
								onMouseLeave={() => handleMouseLeave(catId)}
								onTouchStart={(e) => handleTouchStart(catId, e)}
								onTouchMove={(e) => handleTouchMove(catId, e)}
								onTouchEnd={() => handleTouchEnd(catId)}
							>
								{category?.category.subcategories ? (
									category.category.subcategories.map((item) => (
										<a
											key={item.id}
											href={`/shop?categoryId=${catId}&subcategoryId=${item.id}`}
											className="no-underline"
										>
											<div className="category-section__subcategory-item">
												<div className="category-section__subcategory-image-container">
													<img
														src={item.image}
														alt={item.name}
														className="category-section__subcategory-image"
													/>
												</div>
												<p className="category-section__subcategory-name">
													{item.name}
												</p>
											</div>
										</a>
									))
								) : (
									<p>No subcategories available</p>
								)}
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default CategoryCatalogSection;
