"use strict";
// // Example: routes/webhookRoutes.ts
// import { Router } from "express";
// import { Webhook } from "svix";
// import { prisma } from "../server";
// const router = Router();
// const webhookRouter = router;
// // Make sure to use express.raw({type: 'application/json'}) middleware in your main server file
// // app.use("/api/webhooks/clerk", express.raw({type: 'application/json'}), webhookRoutes);
// router.post("/clerk", async (req, res) => {
//   try {
//     const payloadString = req.body.toString();
//     const svixHeaders = req.headers;
//     const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
//     const evt = wh.verify(payloadString, svixHeaders as any) as any;
//     if (evt.type === 'user.created') {
//       console.log(`✅ Received user.created event for user ${evt.data.id}`);
//       await prisma.user.create({
//         data: {
//           id: evt.data.id, // This is the Clerk User ID
//           email: evt.data.email_addresses[0]?.email_address,
//           // You can pre-fill name/username if available, or leave as null
//           name: `${evt.data.first_name || ''} ${evt.data.last_name || ''}`.trim(),
//           username: evt.data.username || `user_${evt.data.id}`,
//           profilePic: evt.data.image_url,
//         },
//       });
//     }
//     res.status(200).json({ success: true, message: 'Webhook received' });
//   } catch (err) {
//     console.error("Error processing Clerk webhook:", err);
//     res.status(400).json({ success: false, message: 'Webhook error' });
//   }
// });
// export default webhookRouter;
