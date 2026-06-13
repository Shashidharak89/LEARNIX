const clients = new Map();

export const addClient = (requestId, controller) => {
    clients.set(requestId, controller);
};

export const removeClient = (requestId) => {
    clients.delete(requestId);
};

export const sendEvent = (requestId, data) => {
    const controller = clients.get(requestId);
    if (controller) {
        try {
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (error) {
            console.error(`Failed to send event to ${requestId}:`, error);
            removeClient(requestId);
        }
    }
};

export const closeConnection = (requestId) => {
    const controller = clients.get(requestId);
    if (controller) {
        try {
            controller.close();
        } catch (error) {
            // Ignore if already closed
        }
        removeClient(requestId);
    }
};
