import { createExpressServer } from "@trigger.dev/express";
import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";

export const client = new TriggerClient({
  id: "job-catalog",
  apiKey: process.env["TRIGGER_API_KEY"],
  apiUrl: process.env["TRIGGER_API_URL"],
  verbose: false,
  ioLogLocalEnabled: true,
});

client.defineJob({
  id: "event-example-1",
  name: "Event Example 1",
  version: "1.0.0",
  enabled: true,
  trigger: eventTrigger({
    name: "event.example",
  }),
  run: async (payload, io, ctx) => {
    await io.runTask(
      "task-example-1",
      async () => {
        return {
          message: "Hello World",
        };
      },
      { icon: "360" }
    );

    await io.wait("wait-1", 1);

    await io.logger.info("Hello World", { ctx });
  },
});

client.defineJob({
  id: "cancel-event-example",
  name: "Cancel Event Example",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "cancel.event.example",
  }),
  run: async (payload, io, ctx) => {
    const event = await io.sendEvent(
      "send-event",
      { name: "Cancellable Event", id: payload.id, payload: { payload, ctx } },
      {
        deliverAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours from now
      }
    );

    await io.getEvent("get-event", event.id);

    await io.wait("wait-1", 60); // 1 minute

    await io.cancelEvent("cancel-event", event.id);

    await io.getEvent("get-event-2", event.id);
  },
});

client.defineJob({
  id: "zod-schema",
  name: "Job with Zod Schema",
  version: "0.0.2",
  trigger: eventTrigger({
    name: "zod.schema",
    schema: z.object({
      userId: z.string(),
      delay: z.number(),
    }),
  }),
  run: async (payload, io, ctx) => {
    await io.logger.info("Hello World", { ctx, payload });
  },
});

client.defineJob({
  id: "no-real-task",
  name: "No real Task",
  version: "0.0.1",
  trigger: eventTrigger({
    name: "no.real.task",
    schema: z.object({
      userId: z.string(),
    }),
  }),
  run: async (payload, io, ctx) => {
    await io.logger.info("Hello World", { ctx, payload });
    await io.wait("Wait 1 sec", 1);
    //this is a real task
    // await io.runTask("task-example-1", async () => {
    //   return {
    //     message: "Hello World",
    //   };
    // });
  },
});

client.defineJob({
  id: "cancel-runs-example",
  name: "Cancel Runs Example",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "cancel.runs.example",
  }),
  run: async (payload, io, ctx) => {
    const event = await io.sendEvent("send-event", {
      name: "foo.bar",
      id: payload.id,
      payload: { payload, ctx },
    });

    await io.wait("wait-1", 1); // 1 second

    await io.runTask("cancel-runs", async () => {
      return await client.cancelRunsForEvent(event.id);
    });
  },
});

client.defineJob({
  id: "foo-bar-example",
  name: "Foo Bar Example",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "foo.bar",
  }),
  run: async (payload, io, ctx) => {
    await io.logger.info("Hello World", { ctx, payload });

    await io.wait("wait-1", 10); // 10 seconds

    await io.logger.info("Hello World 2", { ctx, payload });
  },
});

client.defineJob({
  id: "foo-bar-example-2",
  name: "Foo Bar Example 2",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "foo.bar",
  }),
  run: async (payload, io, ctx) => {
    await io.logger.info("Hello World", { ctx, payload });

    await io.wait("wait-1", 10); // 10 seconds

    await io.logger.info("Hello World 2", { ctx, payload });
  },
});

const maxPayloads = 10;
const maxInterval = 10;

client.defineJob({
  id: "batch-trigger-receive",
  name: "Batch Trigger Receive",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "batch.trigger",
    batch: {
      maxPayloads,
      maxInterval,
    },
  }),
  run: async (payload, io) => {
    await io.logger.info(`Should at most receive ${maxPayloads} payloads per batch`);
    await io.logger.info(`Should wait no more than ${maxInterval} seconds between batches`);

    const totalPayloadSize = payload.reduce((sum, p) => sum + JSON.stringify(p).length, 0);

    return `Received ${payload.length} payloads. Total size in bytes: ${totalPayloadSize}`;
  },
});

const getLargeString = (bytes: number) => {
  return Array(bytes).fill("F").join("");
};

client.defineJob({
  id: "batch-trigger-send",
  name: "Batch Trigger Send",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "batch.trigger.send",
    schema: z.object({
      payloads: z.number().default(12),
      // expect batches to be chunked as they will exceed the server limit
      oversized: z.boolean().default(false),
    }),
  }),
  run: async (payload, io, ctx) => {
    for (let i = 0; i < payload.payloads; i++) {
      await io.sendEvent(`send-${i}`, {
        name: "batch.trigger",
        payload: {
          count: i,
          run: ctx.run.id,
          ...(payload.oversized
            ? {
                largePayload: getLargeString(250 * 1000), // 250KB
              }
            : undefined),
        },
      });
    }
  },
});

createExpressServer(client);
