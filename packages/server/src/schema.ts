import {
    objectType,
    interfaceType,
    queryType,
    stringArg,
    makeSchema,
    enumType,
    subscriptionField,
    mutationField
} from "nexus";
const path = require("path");

const Node = interfaceType({
    name: "Node",
    definition(t) {
        t.id("id", { description: "Unique identifier for the resource" });
        t.resolveType(() => null);
    },
});

const Post = objectType({
    name: "Post",
    definition(t) {
        t.implements(Node); // or t.implements("Node")
        t.id("id")
        t.boolean("published")
        t.string("title");
        t.string("content");
    },
});

const StatusEnum = enumType({
    name: "StatusEnum",
    members: ["ACTIVE", "DISABLED"],
});

const Query = queryType({
    definition(t) {
        t.field("post", {
            type: Post, // or "Post"
            args: {
                name: stringArg(),
            },
            resolve: async (_, args, ctx) => {
                return (await ctx.prisma.posts({
                    first: 1
                }))[0]
            }
        });
    },
});
const MutationType = enumType({
    name: "MutationType",
    members: [
        "CREATED",
        "UPDATED",
        "DELETED"
    ]
})
const PostSubscriptionPayload = objectType({
    name: "PostSubscriptionPayload",
    definition(t) {
        t.field("mutation", {
            type: MutationType
        })
        t.field("node", {
            type: Post
        })
        t.list.string("updatedFields")
    }
})
const postSubscription = subscriptionField("post", {
    type: PostSubscriptionPayload,
    subscribe: (root, args, context) => {
        return context.prisma.$subscribe.post({ mutation_in: "CREATED" }) as any;
    },
    resolve: (payload) => payload
})

// Recursively traverses the value passed to types looking for
// any valid Nexus or graphql-js objects to add to the schema,
// so you can be pretty flexible with how you import types here.
export const schema = makeSchema({
    types: [Post, Node, Query, StatusEnum, MutationType, postSubscription, PostSubscriptionPayload],
    typegenAutoConfig: {
        sources: [
            { source: path.join(__dirname, "./context.ts"), alias: 'context' },
        ],
        contextType: "context.Context"
    },
    outputs: {
        schema: path.join(__dirname, "./generated-schema.graphql"),
        typegen: path.join(__dirname, "./generated-types.d.ts"),
    },
    // or types: { Post, Node, Query }
    // or types: [Post, [Node], { Query }]
});

