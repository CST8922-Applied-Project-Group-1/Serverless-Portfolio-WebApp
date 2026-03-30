const { WebPubSubServiceClient } = require('@azure/web-pubsub');

module.exports = async function (context, message) {
    context.log('Processing message:', message);

    try {
        // Initialize Web PubSub client
        const serviceClient = new WebPubSubServiceClient(
            process.env.WEB_PUBSUB_CONNECTION_STRING,
            'notifications'
        );

        // Send real-time notification to the recipient
        await serviceClient.sendToUser(message.toUserId.toString(), {
            type: 'newMessage',
            data: {
                messageId: message.messageId,
                fromUserId: message.fromUserId,
                content: message.content,
                sentAt: message.sentAt
            }
        });

        context.log('Notification sent successfully');
    } catch (error) {
        context.log.error('Error processing message:', error);
        throw error;
    }
};
