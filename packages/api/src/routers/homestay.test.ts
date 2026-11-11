import { describe, expect, it, vi } from "vitest";

import type { Session } from "@myrehat-task-b/auth";
import { type Database, LISTING_TYPES } from "@myrehat-task-b/db";
import { listing } from "@myrehat-task-b/db/schema";
import { createRouterClient } from "@orpc/server";

import { appRouter } from "./index";

const USER_ID = "user_1";

type MockFn = ReturnType<typeof vi.fn>;

type SelectChain = {
  from: MockFn;
  where: MockFn;
  orderBy: MockFn;
  limit: MockFn;
  then: PromiseLike<unknown>["then"];
};

type InsertChain = {
  values: MockFn;
  returning: MockFn;
  then: PromiseLike<unknown>["then"];
};

function createSelectChain(result: () => Promise<unknown[]>) {
  const chain = {
    from: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    then: (onFulfilled: unknown, onRejected: unknown) =>
      result().then(onFulfilled as never, onRejected as never),
  } as unknown as SelectChain;

  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.orderBy.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);

  return chain;
}

function createInsertChain(result: () => Promise<unknown[]>) {
  const chain = {
    values: vi.fn(),
    returning: vi.fn(),
    then: (onFulfilled: unknown, onRejected: unknown) =>
      result().then(onFulfilled as never, onRejected as never),
  } as unknown as InsertChain;

  chain.values.mockReturnValue(chain);
  chain.returning.mockReturnValue(chain);

  return chain;
}

function createDbMock({
  select = async () => [],
  insert = async () => [],
}: {
  select?: () => Promise<unknown[]>;
  insert?: () => Promise<unknown[]>;
} = {}) {
  const selectChain = createSelectChain(select);
  const insertChain = createInsertChain(insert);

  const db = {
    select: vi.fn(() => selectChain),
    insert: vi.fn(() => insertChain),
  };

  return {
    db: db as unknown as Database,
    select: db.select,
    insert: db.insert,
    selectChain,
    insertChain,
  };
}

function createSession(): Session {
  return { user: { id: USER_ID } } as unknown as Session;
}

function createClient(db: Database, session: Session | null = createSession()) {
  return createRouterClient(appRouter, { context: { db, session } });
}

function boundParams(clause: unknown): unknown[] {
  const chunks = (
    clause as { queryChunks?: { brand?: unknown; value?: unknown }[] }
  ).queryChunks;

  if (!chunks) {
    return [];
  }

  return chunks
    .filter((chunk) => "encoder" in chunk && "brand" in chunk)
    .map((chunk) => chunk.value);
}

describe("homestay.list", () => {
  it("200 returns the rows", async () => {
    const rows = [{ id: "listing_1", title: "Homestay Melaka" }];
    const { db, select, selectChain } = createDbMock({
      select: async () => rows,
    });

    const result = await createClient(db, null).homestay.list();

    expect(result).toEqual(rows);
    expect(select).toHaveBeenCalledTimes(1);
    expect(selectChain.from).toHaveBeenCalledWith(listing);
    expect(selectChain.orderBy).toHaveBeenCalledTimes(1);
  });

  it("simulate INTERNAL_SERVER_ERROR", async () => {
    const { db } = createDbMock({
      select: async () => {
        throw new Error("query failed", {
          cause: new Error('relation "listing" does not exist'),
        });
      },
    });

    const error = await createClient(db, null)
      .homestay.list()
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: 'relation "listing" does not exist',
    });
  });
});

describe("homestay.getMine", () => {
  it("rejects unauthenticated callers without touching the database", async () => {
    const { db, select } = createDbMock();

    const error = await createClient(db, null)
      .homestay.getMine()
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({ code: "UNAUTHORIZED" });
    expect(select).not.toHaveBeenCalled();
  });

  it("scopes the query to the signed-in user", async () => {
    const rows = [{ id: "listing_1" }];
    const { db, selectChain } = createDbMock({ select: async () => rows });

    const result = await createClient(db).homestay.getMine();

    expect(result).toEqual(rows);
    expect(selectChain.where).toHaveBeenCalledTimes(1);
    expect(boundParams(selectChain.where.mock.calls[0]?.[0])).toEqual([
      USER_ID,
    ]);
  });
});

describe("homestay.getLatest", () => {
  it("returns the three newest listings for anonymous callers", async () => {
    const rows = [{ id: "listing_1" }, { id: "listing_2" }];
    const { db, selectChain } = createDbMock({ select: async () => rows });

    const result = await createClient(db, null).homestay.getLatest();

    expect(result).toEqual(rows);
    expect(selectChain.orderBy).toHaveBeenCalledTimes(1);
    expect(selectChain.limit).toHaveBeenCalledWith(3);
  });
});

describe("homestay.create", () => {
  const validInput = {
    title: "Rumah sewa Langkawi",
    price: 250_000,
    location: "Langkawi",
    type: "buy_property" as const,
    whatsapp: "012-345 6789",
  };

  it("rejects unauthenticated callers without inserting", async () => {
    const { db, insert } = createDbMock();

    const error = await createClient(db, null)
      .homestay.create(validInput)
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({ code: "UNAUTHORIZED" });
    expect(insert).not.toHaveBeenCalled();
  });

  it("stamps the session user id and normalises the whatsapp number", async () => {
    const inserted = { id: "listing_1", ...validInput, userId: USER_ID };
    const { db, insertChain } = createDbMock({
      insert: async () => [inserted],
    });

    const result = await createClient(db).homestay.create(validInput);

    expect(result).toEqual(inserted);
    expect(insertChain.values).toHaveBeenCalledWith({
      title: "Rumah sewa Langkawi",
      price: 250_000,
      location: "Langkawi",
      type: "buy_property",
      whatsapp: "60123456789",
      userId: USER_ID,
    });
  });

  it("ignores a userId supplied by the caller", async () => {
    const { db, insertChain } = createDbMock({
      insert: async () => [{ id: "listing_1" }],
    });

    await createClient(db).homestay.create({
      ...validInput,
      userId: "user_attacker",
    } as never);

    expect(insertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({ userId: USER_ID }),
    );
    expect(insertChain.values).not.toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user_attacker" }),
    );
  });

  it("trims text fields and coerces a numeric string price", async () => {
    const { db, insertChain } = createDbMock({
      insert: async () => [{ id: "listing_1" }],
    });

    await createClient(db).homestay.create({
      ...validInput,
      title: "  Rumah sewa Langkawi  ",
      location: "  Langkawi ",
      price: "250000",
    });

    expect(insertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Rumah sewa Langkawi",
        location: "Langkawi",
        price: 250_000,
      }),
    );
  });

  it.each([
    ["an invalid whatsapp number", { whatsapp: "not-a-phone" }],
    ["a too short title", { title: "ab" }],
    ["a negative price", { price: -1 }],
    ["a non-integer price", { price: 1.5 }],
    ["an unknown listing type", { type: "rent_forever" }],
    ["a missing required field", { location: undefined }],
  ])("rejects %s before writing to the database", async (_label, patch) => {
    const { db, insert } = createDbMock();

    const error = await createClient(db)
      .homestay.create({ ...validInput, ...patch } as never)
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({ code: "BAD_REQUEST" });
    expect(insert).not.toHaveBeenCalled();
  });

  it("names the official categories when rejecting an unknown one", async () => {
    const { db, insert } = createDbMock();

    const error = (await createClient(db)
      .homestay.create({ ...validInput, type: "rent_forever" } as never)
      .catch((caught: unknown) => caught)) as {
      code?: string;
      data?: { issues?: { path: unknown[]; message: string }[] };
    };

    expect(error.code).toBe("BAD_REQUEST");
    expect(insert).not.toHaveBeenCalled();
    expect(error.data?.issues).toEqual([
      expect.objectContaining({
        path: ["type"],
        message:
          "Category must be one of: Buy Property, Buy land to build homestay, Buy Airbnb Profile, Buy Airbnb Business",
      }),
    ]);
  });

  it.each(LISTING_TYPES)(
    "accepts the official category $value",
    async ({ value }) => {
      const { db, insertChain } = createDbMock({
        insert: async () => [{ id: "listing_1" }],
      });

      await createClient(db).homestay.create({ ...validInput, type: value });

      expect(insertChain.values).toHaveBeenCalledWith(
        expect.objectContaining({ type: value }),
      );
    },
  );

  it("returns INTERNAL_SERVER_ERROR without leaking database details", async () => {
    const { db } = createDbMock({
      insert: async () => {
        throw new Error("duplicate key value violates unique constraint");
      },
    });

    const error = await createClient(db)
      .homestay.create(validInput)
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create listing",
    });
  });
});
