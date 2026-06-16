import type { ClickHouseClient } from '@seyr/db/clickhouse';
import { insertEvents } from '@seyr/db/clickhouse';
import type { EventRow } from '@seyr/shared';

/**
 * In-memory write buffer. Accepts rows on the hot path and flushes them to
 * ClickHouse in batches — by size or on a timer — because ClickHouse strongly
 * prefers few large inserts over many small ones. Flushes are serialized so we
 * never overlap inserts, and the buffer drains on shutdown.
 */
export class EventBuffer {
	private rows: EventRow[] = [];
	private timer: ReturnType<typeof setInterval> | null = null;
	private flushing: Promise<void> | null = null;

	constructor(
		private readonly ch: ClickHouseClient,
		private readonly flushSize: number,
		private readonly flushIntervalMs: number
	) {}

	start(): void {
		if (this.timer) return;
		this.timer = setInterval(() => void this.flush(), this.flushIntervalMs);
	}

	add(row: EventRow): void {
		this.rows.push(row);
		if (this.rows.length >= this.flushSize) void this.flush();
	}

	get size(): number {
		return this.rows.length;
	}

	/** Flush the current batch. Concurrent calls coalesce onto the in-flight one. */
	async flush(): Promise<void> {
		if (this.flushing) return this.flushing;
		if (this.rows.length === 0) return;

		const batch = this.rows;
		this.rows = [];
		this.flushing = insertEvents(this.ch, batch)
			.catch((err) => {
				// Don't lose the batch on a transient failure — requeue at the front.
				console.error(`[buffer] flush failed (${batch.length} rows), requeuing`, err);
				this.rows = batch.concat(this.rows);
			})
			.finally(() => {
				this.flushing = null;
			});
		return this.flushing;
	}

	/** Stop the timer and flush whatever remains. */
	async stop(): Promise<void> {
		if (this.timer) clearInterval(this.timer);
		this.timer = null;
		await this.flush();
	}
}
