import Product from "../../models/products.js";

export async function searchRoutes(fastify, options) {
  fastify.get("/search", async (req, reply) => {
    console.log("📩 Query received:", req.query.q);
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return reply.send([]);
    }

    try {
      const results = await Product.aggregate([
        {
          $search: {
            index: "Grocery", // name you created in Atlas
            text: {
              query: q,
              path: ["name"], // only existing searchable fields
              fuzzy: { maxEdits: 1 },
            },
          },
        },
        { $limit: 30 },

        {
          $project: {
            name: 1,
            image: 1,
            price: 1,
            discountPrice: 1,
            quantity: 1,
            // stock: 1, // ✅ REQUIRED FOR YOUR BUTTON LOGIC
            stock: { $ifNull: ["$stock", 0] }, // 👈 force stock
            score: { $meta: "searchScore" }, // optional but useful
          },
        },
      ]);

      return reply.send(results);
    } catch (err) {
      console.error("Search error:", err);
      return reply.status(500).send({ message: "Search failed" });
    }
  });
}
