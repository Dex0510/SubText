import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { authenticateJWT } from '../middleware/auth';
import { env } from '../config/env';
import { PaymentModel } from '../models/Payment';
import { UserModel } from '../models/User';
import { ConversationModel } from '../models/Conversation';

const router = Router();

const stripe = new Stripe(env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
});

const PRICES = {
  pro_features: 2000, // $20 per conversation
  mri_unlimited: 1000, // $10 per conversation
} as const;

// Create payment intent for Pro Features or MRI Unlimited
router.post(
  '/create-intent',
  authenticateJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { product_type, conversation_id } = req.body;
      const userId = req.user!.user_id;

      if (!product_type || !(product_type in PRICES)) {
        res.status(400).json({ error: 'Invalid product type. Must be pro_features or mri_unlimited.' });
        return;
      }

      if (!conversation_id) {
        res.status(400).json({ error: 'conversation_id is required' });
        return;
      }

      // Verify conversation ownership
      const conversation = await ConversationModel.findById(conversation_id);
      if (!conversation || conversation.user_id !== userId) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }

      // Check if already purchased
      if (product_type === 'pro_features' && conversation.pro_purchased) {
        res.status(400).json({ error: 'Pro features already purchased for this conversation' });
        return;
      }
      if (product_type === 'mri_unlimited' && conversation.mri_unlimited) {
        res.status(400).json({ error: 'MRI Unlimited already purchased for this conversation' });
        return;
      }
      if (product_type === 'mri_unlimited' && !conversation.pro_purchased) {
        res.status(400).json({ error: 'Pro features must be purchased first' });
        return;
      }

      const amount = PRICES[product_type as keyof typeof PRICES];

      // Get or create Stripe customer
      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      let customerId = user.stripe_customer_id;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { user_id: userId },
        });
        customerId = customer.id;
        await UserModel.updateStripeCustomerId(userId, customerId);
      }

      const description = product_type === 'pro_features'
        ? `Pro Features for "${conversation.contact_name}" conversation — $20`
        : `MRI Unlimited for "${conversation.contact_name}" conversation — $10`;

      // Create PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        customer: customerId,
        description,
        metadata: {
          user_id: userId,
          product_type,
          conversation_id,
        },
      });

      // Record payment in database
      await PaymentModel.create(userId, paymentIntent.id, amount);

      res.json({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        amount,
        product_type,
        conversation_id,
      });
    } catch (err) {
      console.error('Payment intent error:', err);
      res.status(500).json({ error: 'Failed to create payment' });
    }
  }
);

// Stripe webhook
router.post(
  '/webhook',
  async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers['stripe-signature'] as string;

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      res.status(400).json({ error: 'Webhook signature verification failed' });
      return;
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await PaymentModel.updateStatus(paymentIntent.id, 'succeeded');

        const { product_type, conversation_id } = paymentIntent.metadata;

        if (conversation_id) {
          if (product_type === 'pro_features') {
            await ConversationModel.purchasePro(conversation_id);
            console.log(`Pro features unlocked for conversation: ${conversation_id}`);
          } else if (product_type === 'mri_unlimited') {
            await ConversationModel.purchaseMriUnlimited(conversation_id);
            console.log(`MRI Unlimited unlocked for conversation: ${conversation_id}`);
          }
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await PaymentModel.updateStatus(paymentIntent.id, 'failed');
        console.log(`Payment failed: ${paymentIntent.id}`);
        break;
      }
    }

    res.json({ received: true });
  }
);

export default router;
