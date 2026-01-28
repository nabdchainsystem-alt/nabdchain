/**
 * Shared Hooks
 * Generic hooks that can be used across features
 */

export { useClickOutside } from './useClickOutside';
export {
    useDebounce,
    useDebouncedCallback,
    useThrottledCallback,
    useMemoCompare,
    usePrevious,
    useIsMounted,
    useDeferredValue,
} from './useDebounce';
export {
    useIntersection,
    useInfiniteScroll,
    useIsVisible,
    useLazyLoad,
} from './useIntersection';
export {
    usePageVisibility,
    useStableWhileHidden,
    usePauseWhileHidden,
    useSkipAnimationOnReturn,
} from './usePageVisibility';
export {
    useWorkerSort,
    useWorkerFilter,
    useWorkerSearch,
    useWorkerAggregate,
    useWorkerStats,
    useComputeWorker,
    terminateWorker,
} from './useWorker';
export {
    useSpringValue,
    useSmoothMousePosition,
    useSmoothScrollPosition,
    usePrefersReducedMotion,
    useOptimalDuration,
    useSmoothHover,
    useSmoothVisibility,
} from './useSmoothAnimation';
