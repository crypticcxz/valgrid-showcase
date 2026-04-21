import type { Collection, UtilsRecord } from "@tanstack/db"
import { useLiveQuery } from "@tanstack/solid-db"

type ElectricCollection<T extends { id: string }> = Collection<
	T,
	string | number,
	UtilsRecord,
	never,
	T
>

type UseLiveFn = <T extends { id: string }>(
	queryFn: () => ElectricCollection<T> | null,
) => () => Array<T>

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
export const useLive = useLiveQuery as unknown as UseLiveFn
