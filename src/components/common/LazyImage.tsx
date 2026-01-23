/**
 * LazyImage - Performance-optimized image component
 * - Lazy loads images when they enter viewport
 * - Shows placeholder/skeleton while loading
 * - Supports blur-up effect
 * - Handles errors gracefully
 */
import React, { useState, useRef, useEffect, memo } from 'react';

interface LazyImageProps {
    src: string;
    alt: string;
    className?: string;
    width?: number | string;
    height?: number | string;
    /** Placeholder image or color */
    placeholder?: string;
    /** Show blur effect while loading */
    blur?: boolean;
    /** Fallback image on error */
    fallback?: string;
    /** Custom loading component */
    loadingComponent?: React.ReactNode;
    /** Object fit style */
    objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
    /** Callback when image loads */
    onLoad?: () => void;
    /** Callback on error */
    onError?: () => void;
    /** Root margin for intersection observer */
    rootMargin?: string;
    /** Optional style object */
    style?: React.CSSProperties;
}

function LazyImageInner({
    src,
    alt,
    className = '',
    width,
    height,
    placeholder,
    blur = true,
    fallback = '',
    loadingComponent,
    objectFit = 'cover',
    onLoad,
    onError,
    rootMargin = '100px',
    style,
}: LazyImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef<HTMLDivElement>(null);

    // Intersection Observer for lazy loading
    useEffect(() => {
        const element = imgRef.current;
        if (!element) return;

        // Check if IntersectionObserver is supported
        if (!('IntersectionObserver' in window)) {
            setIsInView(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.unobserve(element);
                }
            },
            {
                rootMargin,
                threshold: 0.01,
            }
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [rootMargin]);

    const handleLoad = () => {
        setIsLoaded(true);
        onLoad?.();
    };

    const handleError = () => {
        setHasError(true);
        onError?.();
    };

    const currentSrc = hasError && fallback ? fallback : src;

    // Default placeholder (light gray)
    const placeholderStyle: React.CSSProperties = {
        backgroundColor: placeholder || '#f3f4f6',
        width: width || '100%',
        height: height || '100%',
    };

    return (
        <div
            ref={imgRef}
            className={`relative overflow-hidden ${className}`}
            style={{
                width,
                height,
                ...style,
            }}
        >
            {/* Placeholder/Skeleton */}
            {!isLoaded && (
                <div
                    className="absolute inset-0 animate-pulse"
                    style={placeholderStyle}
                >
                    {loadingComponent || (
                        <div className="w-full h-full flex items-center justify-center">
                            <svg
                                className="w-8 h-8 text-gray-300"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                    )}
                </div>
            )}

            {/* Actual Image */}
            {isInView && (
                <img
                    src={currentSrc}
                    alt={alt}
                    className={`
                        w-full h-full transition-all duration-300
                        ${blur && !isLoaded ? 'blur-sm scale-105' : 'blur-0 scale-100'}
                        ${isLoaded ? 'opacity-100' : 'opacity-0'}
                    `}
                    style={{ objectFit }}
                    onLoad={handleLoad}
                    onError={handleError}
                    loading="lazy"
                    decoding="async"
                />
            )}
        </div>
    );
}

export const LazyImage = memo(LazyImageInner);

// ============================================================================
// Avatar Component (Optimized for lists)
// ============================================================================

interface AvatarProps {
    src?: string;
    name: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const sizeMap = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
};

function AvatarInner({ src, name, size = 'md', className = '' }: AvatarProps) {
    const [hasError, setHasError] = useState(false);

    // Generate initials from name
    const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    // Generate consistent color from name
    const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
        'bg-blue-500',
        'bg-green-500',
        'bg-purple-500',
        'bg-orange-500',
        'bg-pink-500',
        'bg-teal-500',
        'bg-indigo-500',
        'bg-red-500',
    ];
    const bgColor = colors[colorIndex % colors.length];

    if (!src || hasError) {
        return (
            <div
                className={`
                    ${sizeMap[size]} ${bgColor}
                    rounded-full flex items-center justify-center
                    text-white font-medium
                    ${className}
                `}
            >
                {initials}
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={name}
            className={`${sizeMap[size]} rounded-full object-cover ${className}`}
            onError={() => setHasError(true)}
            loading="lazy"
        />
    );
}

export const Avatar = memo(AvatarInner);

// ============================================================================
// Skeleton Components
// ============================================================================

interface SkeletonProps {
    className?: string;
    width?: number | string;
    height?: number | string;
    rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

const roundedMap = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
};

export function Skeleton({
    className = '',
    width,
    height,
    rounded = 'md',
}: SkeletonProps) {
    return (
        <div
            className={`
                animate-pulse bg-gray-200 dark:bg-gray-700
                ${roundedMap[rounded]}
                ${className}
            `}
            style={{ width, height }}
        />
    );
}

// Predefined skeleton variants
export const TextSkeleton = memo(({ lines = 1, className = '' }: { lines?: number; className?: string }) => (
    <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
                key={i}
                height={16}
                width={i === lines - 1 ? '75%' : '100%'}
            />
        ))}
    </div>
));

export const CardSkeleton = memo(({ className = '' }: { className?: string }) => (
    <div className={`p-4 space-y-3 ${className}`}>
        <div className="flex items-center space-x-3">
            <Skeleton width={40} height={40} rounded="full" />
            <div className="flex-1 space-y-2">
                <Skeleton height={14} width="60%" />
                <Skeleton height={12} width="40%" />
            </div>
        </div>
        <Skeleton height={12} />
        <Skeleton height={12} width="80%" />
    </div>
));

export const TableRowSkeleton = memo(({ columns = 4, className = '' }: { columns?: number; className?: string }) => (
    <div className={`flex items-center space-x-4 p-3 ${className}`}>
        {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
                key={i}
                height={16}
                className="flex-1"
                width={i === 0 ? '40%' : undefined}
            />
        ))}
    </div>
));

export default LazyImage;
