'use client';

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import "@/styles/CategorySection.css";
import { useCategory } from "@/lib/context/Category";
import { fetchCategoryCatalog } from "@/lib/api/categoryCatalog";
import { useQuery } from "@tanstack/react-query";
import type { Category } from "@/lib/context/Category";

interface CategorySectionProps {
	maxItemsToShow?: number;
	showViewAll?: boolean;
}

const CategorySection: React.FC<CategorySectionProps> = ({
	maxItemsToShow = 6,
	showViewAll = true,
}) => {
	const [isCategoriesReady, setIsCategoriesReady] = useState(false);

	const categoryContext = useCategory();
	const updateCategoriesWithSubcategories =
		categoryContext?.updateCategoriesWithSubcategories;
	const categories = categoryContext?.categories || [];
	const router = useRouter();
	const pathname = usePathname();

	// Carousel state and refs
	const carouselRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
	const [isDragging, setIsDragging] = useState<{ [key: string]: boolean }>({});
	const [startX, setStartX] = useState<{ [key: string]: number }>({});
	const [scrollLeft, setScrollLeft] = useState<{ [key: string]: number }>({});

	// Fetch categories with React Query
	//("Before executing fetchCategoryCatalog");
	const {
		data: categoryData,
		isLoading: isCategoryLoading,
		error,
	} = useQuery({
		queryKey: ["cat"],
		queryFn: fetchCategoryCatalog,
		staleTime: 5 * 60 * 1000,
		gcTime: 30 * 60 * 1000,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		refetchOnReconnect: false,
	});
	//("Category Catalog Data: ", categoryData);

	// Preload images for better performance
	useEffect(() => {
		if (categories) {
			categories.forEach((maincategory) => {
				maincategory.items.forEach((item) => {
					if (item.image) {
						const img = new Image();
						img.src = item.image;
					}
				});
			});
		}
	}, [categories]);

	useEffect(() => {
		//("Category data fetched:", categoryData);
	}, []);

	// Update categories when data is fetched
	useEffect(() => {
		if (updateCategoriesWithSubcategories && categoryData) {
			updateCategoriesWithSubcategories(categoryData).then(() => {
				setIsCategoriesReady(true);
			});
		}
	}, [categoryData, updateCategoriesWithSubcategories]);

	// Show loading state if either fetching or processing categories
	const showLoading = isCategoryLoading || !isCategoriesReady;

	// Carousel drag handlers
	const handleMouseDown = useCallback(
		(e: React.MouseEvent, categoryId: string) => {
			const carousel = carouselRefs.current[categoryId];
			if (!carousel) return;

			setIsDragging((prev) => ({ ...prev, [categoryId]: true }));
			setStartX((prev) => ({
				...prev,
				[categoryId]: e.pageX - carousel.offsetLeft,
			}));
			setScrollLeft((prev) => ({ ...prev, [categoryId]: carousel.scrollLeft }));
			carousel.style.cursor = "grabbing";
		},
		[]
	);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent, categoryId: string) => {
			const startXValue = startX[categoryId];
			const scrollLeftValue = scrollLeft[categoryId];
			if (!isDragging[categoryId] || startXValue === undefined || scrollLeftValue === undefined) return;

			e.preventDefault();
			const carousel = carouselRefs.current[categoryId];
			if (!carousel) return;

			const x = e.pageX - carousel.offsetLeft;
			const walk = (x - startXValue) * 2;
			carousel.scrollLeft = scrollLeftValue - walk;
		},
		[isDragging, startX, scrollLeft]
	);

	const handleMouseUp = useCallback((categoryId: string) => {
		setIsDragging((prev) => ({ ...prev, [categoryId]: false }));
		const carousel = carouselRefs.current[categoryId];
		if (carousel) {
			carousel.style.cursor = "grab";
		}
	}, []);

	const handleMouseLeave = useCallback((categoryId: string) => {
		setIsDragging((prev) => ({ ...prev, [categoryId]: false }));
		const carousel = carouselRefs.current[categoryId];
		if (carousel) {
			carousel.style.cursor = "grab";
		}
	}, []);

	// Touch support
	const handleTouchStart = useCallback(
		(e: React.TouchEvent, categoryId: string) => {
			const carousel = carouselRefs.current[categoryId];
			const touch = e.touches[0];
			if (!carousel || !touch) return;

			setIsDragging((prev) => ({ ...prev, [categoryId]: true }));
			setStartX((prev) => ({
				...prev,
				[categoryId]: touch.pageX - carousel.offsetLeft,
			}));
			setScrollLeft((prev) => ({ ...prev, [categoryId]: carousel.scrollLeft }));
		},
		[]
	);

	const handleTouchMove = useCallback(
		(e: React.TouchEvent, categoryId: string) => {
			const touch = e.touches[0];
			const startXValue = startX[categoryId];
			const scrollLeftValue = scrollLeft[categoryId];
			if (!isDragging[categoryId] || !touch || startXValue === undefined || scrollLeftValue === undefined) return;

			const carousel = carouselRefs.current[categoryId];
			if (!carousel) return;

			const x = touch.pageX - carousel.offsetLeft;
			const walk = (x - startXValue) * 2;
			carousel.scrollLeft = scrollLeftValue - walk;
		},
		[isDragging, startX, scrollLeft]
	);

	const handleTouchEnd = useCallback((categoryId: string) => {
		setIsDragging((prev) => ({ ...prev, [categoryId]: false }));
	}, []);

	// Keyboard navigation
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent, categoryId: string) => {
			if (e.key === "ArrowLeft") {
				scrollCarousel(categoryId, "left");
			} else if (e.key === "ArrowRight") {
				scrollCarousel(categoryId, "right");
			}
		},
		[]
	);

	// Prevent click when dragging
	const handleItemClick = useCallback(
		(mainCategoryId: string, itemId: string, e: React.MouseEvent) => {
			if (isDragging[mainCategoryId]) {
				e.preventDefault();
				return;
			}
			handleCategoryClick(mainCategoryId, itemId);
		},
		[isDragging]
	);

	// Enhanced category click handler
	const handleCategoryClick = (mainCategoryId: string, itemId: string) => {
		const newUrl = `/shop?categoryId=${mainCategoryId}&subcategoryId=${itemId}`;

		if (pathname === "/shop") {
			router.replace(newUrl);
			const event = new CustomEvent("shopFiltersChanged", {
				detail: {
					categoryId: Number(mainCategoryId),
					subcategoryId: Number(itemId),
				},
			});
			setTimeout(() => {
				window.dispatchEvent(event);
			}, 10);
		} else {
			router.push(newUrl);
		}
	};

	const handleViewAllClick = (categoryId: string) => {
		const newUrl = `/shop?categoryId=${categoryId}`;
		router.push(newUrl);
	};

	// Navigation arrows
	const scrollCarousel = (categoryId: string, direction: "left" | "right") => {
		const carousel = carouselRefs.current[categoryId];
		if (!carousel) return;

		const scrollAmount = 300;
		const newScrollLeft =
			direction === "left"
				? carousel.scrollLeft - scrollAmount
				: carousel.scrollLeft + scrollAmount;

		carousel.scrollTo({
			left: newScrollLeft,
			behavior: "smooth",
		});
	};

	// Skeleton loading component
	const SubcategorySkeleton = () => (
		<div className="category-section__subcategory-item category-section__subcategory-item--skeleton">
			<div className="category-section__subcategory-image-container">
				<div className="category-section__subcategory-image-skeleton skeleton"></div>
			</div>
			<div className="category-section__subcategory-name-skeleton skeleton-text"></div>
		</div>
	);

	// Skeleton section component
	const SkeletonSection = ({ maxItems }: { maxItems: number }) => (
		<div className="category-section__category">
			<div className="category-section__header">
				<div className="category-section__title-skeleton skeleton-text"></div>
				<div className="category-section__view-all-skeleton skeleton-text"></div>
			</div>
			<div className="category-section__carousel-container">
				<div className="category-section__subcategories category-section__subcategories--carousel">
					{Array.from({ length: maxItems }).map((_, index) => (
						<SubcategorySkeleton key={`sub-skeleton-${index}`} />
					))}
				</div>
			</div>
		</div>
	);

	if (error) {
		return (
			<div className="category-section__error">
				Error loading categories: {error.message}
			</div>
		);
	}

	if (showLoading) {
		return (
			<div className="category-section">
				{Array.from({ length: 3 }).map((_, sectionIndex) => (
					<SkeletonSection
						key={`section-skeleton-${sectionIndex}`}
						maxItems={maxItemsToShow}
					/>
				))}
			</div>
		);
	}

	return (
		<div className="category-section">
			{categories.slice(0, 5).map((maincategory: Category) => {
				const categoryIdStr = String(maincategory.id);
				return (
					<div
						key={`section-${maincategory.id}`}
						className="category-section__category"
					>
						<div className="category-section__header">
							<h2 className="category-section__title">{maincategory.name}</h2>
							{showViewAll && (
								<button
									className="category-section__view-all"
									onClick={() => handleViewAllClick(categoryIdStr)}
								>
									View All
								</button>
							)}
						</div>

						<div className="category-section__carousel-container">
							<button
								className="category-section__nav-arrow category-section__nav-arrow--left"
								onClick={() => scrollCarousel(categoryIdStr, "left")}
								aria-label="Scroll left"
							>
								&#8249;
							</button>

							<div
								ref={(el) => { carouselRefs.current[categoryIdStr] = el; }}
								className="category-section__subcategories category-section__subcategories--carousel"
								onMouseDown={(e) => handleMouseDown(e, categoryIdStr)}
								onMouseMove={(e) => handleMouseMove(e, categoryIdStr)}
								onMouseUp={() => handleMouseUp(categoryIdStr)}
								onMouseLeave={() => handleMouseLeave(categoryIdStr)}
								onTouchStart={(e) => handleTouchStart(e, categoryIdStr)}
								onTouchMove={(e) => handleTouchMove(e, categoryIdStr)}
								onTouchEnd={() => handleTouchEnd(categoryIdStr)}
								onKeyDown={(e) => handleKeyDown(e, categoryIdStr)}
								tabIndex={0}
							>
								{maincategory.items.map((item) => (
									<div
										style={{
											display: "flex",
											flexDirection: "column",
											gap: "10px",
											justifyContent: "center",
											alignItems: "center",
											maxWidth: "280px",
										}}
										key={`sub-${maincategory.id}-${item.id}`}
									>
										<div
											className="category-section__subcategory-item"
											onClick={(e) =>
												handleItemClick(categoryIdStr, String(item.id), e)
											}
											role="button"
											aria-label={`View ${item.name}`}
										>
											<div className="category-section__subcategory-image-container">
												<img
													src={item.image}
													alt={item.name}
													className="category-section__subcategory-image"
													loading="lazy"
													decoding="async"
													draggable={false}
												/>
											</div>
										</div>
										<p className="category-section__subcategory-name">
											{item.name}
										</p>
									</div>
								))}
							</div>

							<button
								className="category-section__nav-arrow category-section__nav-arrow--right"
								onClick={() => scrollCarousel(categoryIdStr, "right")}
								aria-label="Scroll right"
							>
								&#8250;
							</button>
						</div>
					</div>
				)
			})}
		</div>
	);
};

export default CategorySection;
