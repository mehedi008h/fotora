import { useQuery, useMutation } from "convex/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const useConvexQuery = (query: any, ...args: any[]) => {
    const result = useQuery(query, args[0]);
    const [data, setData] = useState(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Use effect to handle the state changes based on the query result
    useEffect(() => {
        if (result === undefined) {
            setIsLoading(true);
        } else {
            try {
                setData(result);
                setError(null);
            } catch (err) {
                setError(err as Error);
                toast.error((err as Error).message);
            } finally {
                setIsLoading(false);
            }
        }
    }, [result]);

    return {
        data,
        isLoading,
        error,
    };
};

export const useConvexMutation = (mutation: any) => {
    const mutationFn = useMutation(mutation);
    const [data, setData] = useState(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const mutate = async (...args: any[]) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await mutationFn(args[0]);
            setData(response);
            return response;
        } catch (err) {
            setError(err as Error);
            toast.error((err as Error).message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return { mutate, data, isLoading, error };
};
