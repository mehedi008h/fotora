"use client";

import { useEffect, useState, useRef } from "react";

export const useIntersectionObserver = (
    threshold = 0.1,
    rootMargin = "0px"
) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!ref.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { threshold, rootMargin }
        );

        observer.observe(ref.current);

        return () => {
            if (ref.current) observer.unobserve(ref.current);
            observer.disconnect();
        };
    }, [threshold, rootMargin]);

    return [ref, isVisible] as const;
};

export const useAnimatedCounter = (
    target: number,
    duration = 2000,
    autoStart = false
) => {
    const [count, setCount] = useState(0);
    const [isActive, setIsActive] = useState(autoStart);

    useEffect(() => {
        if (!isActive) return;

        const step = target / (duration / 16);
        const timer = setInterval(() => {
            setCount((prev) => {
                const next = prev + step;
                if (next >= target) {
                    clearInterval(timer);
                    return target;
                }
                return next;
            });
        }, 16);

        return () => clearInterval(timer);
    }, [target, duration, isActive]);

    return [Math.floor(count), setIsActive] as const;
};

/** Combined hook: start counting when element is in view */
export const useCountOnView = (
    target: number,
    duration = 2000,
    threshold = 0.1
) => {
    const [ref, isVisible] = useIntersectionObserver(threshold);
    const [count, setIsActive] = useAnimatedCounter(target, duration);

    useEffect(() => {
        if (isVisible) setIsActive(true);
    }, [isVisible, setIsActive]);

    return [ref, count] as const;
};
