const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createOrderStore } = require('../lib/order-store');

async function run() {
    const originalWarn = console.warn;
    console.warn = function () {};

    const filePath = path.join(os.tmpdir(), 'mallow-order-store-' + process.pid + '.ndjson');
    const eventId = 'evt_test_' + Date.now();

    try {
        const store = createOrderStore({ filePath: filePath, production: false });
        await store.initialize();
        assert.strictEqual(await store.claimEvent(eventId, 'checkout.session.completed'), 'claimed');
        assert.strictEqual(await store.claimEvent(eventId, 'checkout.session.completed'), 'busy');
        await store.markEventFailed(eventId, new Error('test'));
        assert.strictEqual(await store.claimEvent(eventId, 'checkout.session.completed'), 'claimed');

        await store.saveCompletedOrder({
            eventId: eventId,
            sessionId: 'cs_test',
            paymentStatus: 'paid',
            amountTotal: 22.95,
            customerEmail: 'test@example.com',
            lineItems: [{ description: 'Mallow Day', quantity: 1 }],
            checkoutMetadata: { item_summary: 'mallow-dayx1' },
            loggedAt: new Date().toISOString()
        });
        const orders = await store.listRecentOrders(10);
        assert.strictEqual(orders.length, 1);
        assert.strictEqual(orders[0].sessionId, 'cs_test');
        assert.strictEqual(orders[0].checkoutMetadata.item_summary, 'mallow-dayx1');
        await store.close();

        const restartedStore = createOrderStore({ filePath: filePath, production: false });
        await restartedStore.initialize();
        assert.strictEqual(await restartedStore.claimEvent(eventId, 'checkout.session.completed'), 'completed');
        await restartedStore.close();

        console.log('Order store check passed.');
    } finally {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
}

run().catch(function (error) {
    console.error(error);
    process.exitCode = 1;
});
