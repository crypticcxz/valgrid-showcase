import {
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core"

export const users = pgTable("users", {
	id: varchar("id", { length: 21 }).primaryKey(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	passwordHash: text("passwordHash").notNull(),
	displayName: varchar("displayName", { length: 100 }).notNull(),
	tier: varchar("tier", { length: 20 }).notNull().default("free"),
	maxDeployments: integer("maxDeployments").notNull().default(2),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const deployments = pgTable("deployments", {
	id: varchar("id", { length: 21 }).primaryKey(),
	userId: varchar("userId", { length: 21 })
		.notNull()
		.references(() => users.id),
	name: varchar("name", { length: 100 }).notNull(),
	status: varchar("status", { length: 20 }).notNull().default("pending"),
	containerId: varchar("containerId", { length: 64 }),
	imageTag: varchar("imageTag", { length: 200 }),
	archiveKey: text("archiveKey").notNull(),
	entrypoint: varchar("entrypoint", { length: 255 })
		.notNull()
		.default("main.py"),
	envVars: jsonb("envVars").notNull().default({}),
	cpuLimit: integer("cpuLimit").notNull().default(1),
	memoryLimitMb: integer("memoryLimitMb").notNull().default(256),
	restartPolicy: varchar("restartPolicy", { length: 20 })
		.notNull()
		.default("on-failure"),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
	stoppedAt: timestamp("stoppedAt"),
	lastCrashReason: text("lastCrashReason"),
	restartCount: integer("restartCount").notNull().default(0),
})

export const deploymentEvents = pgTable("deployment_events", {
	id: varchar("id", { length: 21 }).primaryKey(),
	deploymentId: varchar("deploymentId", { length: 21 })
		.notNull()
		.references(() => deployments.id, { onDelete: "cascade" }),
	type: varchar("type", { length: 30 }).notNull(),
	message: text("message"),
	metadata: jsonb("metadata").default({}),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const deploymentLogs = pgTable("deployment_logs", {
	id: varchar("id", { length: 21 }).primaryKey(),
	deploymentId: varchar("deploymentId", { length: 21 })
		.notNull()
		.references(() => deployments.id, { onDelete: "cascade" }),
	stream: varchar("stream", { length: 10 }).notNull().default("stdout"),
	message: text("message").notNull(),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
})
